import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { assetStatusToApi, fetchAssets, toAsset, toRental, type ApiAsset, type ApiRental } from '../lib/backendApi'
import type { Asset, RentalRecord, AssetStatus } from '../types'

interface AssetStore {
  assets: Asset[]
  isLoading: boolean
  error?: string
  loadAssets: (cohortId: string) => Promise<void>
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'rentalHistory'>, photo?: File | null) => Promise<void>
  updateAsset: (id: string, data: Partial<Asset>, photo?: File | null) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  rentAsset: (assetId: string, record: Omit<RentalRecord, 'id'>) => Promise<void>
  returnAsset: (assetId: string, rentalId: string) => Promise<void>
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  isLoading: false,
  error: undefined,
  loadAssets: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ assets: await fetchAssets(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '자산 목록을 불러오지 못했습니다.' })
    }
  },
  addAsset: async (asset, photo) => {
    const saved = await apiRequest<ApiAsset>('/api/assets', {
      method: 'POST',
      body: assetToFormData(asset, photo),
    })
    set((state) => ({
      assets: [...state.assets, toAsset(saved)],
    }))
  },
  updateAsset: async (id, data, photo) => {
    const saved = await apiRequest<ApiAsset>(`/api/assets/${id}`, {
      method: 'PUT',
      body: assetToFormData(data, photo),
    })
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, ...toAsset(saved), rentalHistory: a.rentalHistory } : a)),
    }))
  },
  deleteAsset: async (id) => {
    await apiRequest<void>(`/api/assets/${id}`, { method: 'DELETE' })
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
    }))
  },
  rentAsset: async (assetId, record) => {
    const saved = await apiRequest<ApiRental>(`/api/assets/${assetId}/rent`, {
      method: 'POST',
      body: JSON.stringify({
        borrowerName: record.borrowerName,
        studentId: record.studentId,
        contact: record.contact,
        dueAt: record.dueAt.length <= 10 ? `${record.dueAt}T23:59:00` : record.dueAt,
        quantity: record.quantity,
        note: record.note,
      }),
    })
    set((state) => ({
      assets: state.assets.map((a) => {
        if (a.id !== assetId) return a
        const newRecord: RentalRecord = toRental(saved)
        const newAvailable = a.availableQuantity - record.quantity
        return {
          ...a,
          availableQuantity: newAvailable,
          status: newAvailable <= 0 ? 'rented' : a.status,
          rentalHistory: [...a.rentalHistory, newRecord],
        }
      }),
    }))
  },
  returnAsset: async (assetId, rentalId) => {
    const saved = await apiRequest<ApiRental>(`/api/assets/${assetId}/rentals/${rentalId}/return`, {
      method: 'PATCH',
    })
    set((state) => ({
      assets: state.assets.map((a) => {
        if (a.id !== assetId) return a
        const rental = toRental(saved)
        if (!rental) return a
        const newAvailable = a.availableQuantity + (rental.quantity || 1)
        return {
          ...a,
          availableQuantity: newAvailable,
          status: (newAvailable >= a.quantity ? 'available' : a.status) as AssetStatus,
          rentalHistory: a.rentalHistory.map((r) =>
            r.id === rentalId
              ? rental
              : r
          ),
        }
      }),
    }))
  },
}))

function assetToFormData(asset: Partial<Asset>, photo?: File | null) {
  const form = new FormData()
  if (asset.cohortId) form.append('cohortId', asset.cohortId)
  if (asset.name) form.append('name', asset.name)
  if (asset.category) form.append('category', asset.category)
  asset.tags?.forEach((tag) => form.append('tags', tag))
  if (asset.quantity !== undefined) form.append('quantity', String(asset.quantity))
  if (asset.purchasePrice !== undefined) form.append('purchasePrice', String(asset.purchasePrice))
  if (asset.location !== undefined) form.append('location', asset.location)
  if (asset.status) form.append('status', assetStatusToApi(asset.status))
  if (asset.description !== undefined) form.append('description', asset.description)
  if (photo) form.append('photo', photo)
  return form
}
