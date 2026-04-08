import { create } from 'zustand'
import { assets as initialAssets } from '../data/assets'
import type { Asset, RentalRecord, AssetStatus } from '../types'

interface AssetStore {
  assets: Asset[]
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'rentalHistory'>) => void
  updateAsset: (id: string, data: Partial<Asset>) => void
  deleteAsset: (id: string) => void
  rentAsset: (assetId: string, record: Omit<RentalRecord, 'id'>) => void
  returnAsset: (assetId: string, rentalId: string) => void
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: initialAssets,
  addAsset: (asset) =>
    set((state) => ({
      assets: [
        ...state.assets,
        {
          ...asset,
          id: `asset-${Date.now()}`,
          rentalHistory: [],
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  updateAsset: (id, data) =>
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  deleteAsset: (id) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
    })),
  rentAsset: (assetId, record) =>
    set((state) => ({
      assets: state.assets.map((a) => {
        if (a.id !== assetId) return a
        const newRecord: RentalRecord = { ...record, id: `rent-${Date.now()}` }
        const newAvailable = a.availableQuantity - record.quantity
        return {
          ...a,
          availableQuantity: newAvailable,
          status: newAvailable <= 0 ? 'rented' : a.status,
          rentalHistory: [...a.rentalHistory, newRecord],
        }
      }),
    })),
  returnAsset: (assetId, rentalId) =>
    set((state) => ({
      assets: state.assets.map((a) => {
        if (a.id !== assetId) return a
        const rental = a.rentalHistory.find((r) => r.id === rentalId)
        if (!rental) return a
        const newAvailable = a.availableQuantity + (rental.quantity || 1)
        return {
          ...a,
          availableQuantity: newAvailable,
          status: (newAvailable >= a.quantity ? 'available' : a.status) as AssetStatus,
          rentalHistory: a.rentalHistory.map((r) =>
            r.id === rentalId
              ? { ...r, returnedAt: new Date().toISOString().slice(0, 10) }
              : r
          ),
        }
      }),
    })),
}))
