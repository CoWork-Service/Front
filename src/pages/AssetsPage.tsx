import React, { useState, useMemo } from 'react'
import { Plus, Search, Package, Trash2, Edit2, ArrowRightLeft, RotateCcw, Image } from 'lucide-react'
import { useAssetStore } from '../store/useAssetStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { AssetStatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { Drawer } from '../components/common/Drawer'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import type { Asset, RentalRecord } from '../types'

const defaultAssetForm = {
  name: '', category: '', tags: '', photoUrl: '',
  quantity: '1', purchasePrice: '0', location: '', description: '',
}

const defaultRentForm = {
  borrowerName: '', studentId: '', contact: '',
  rentedAt: '', dueAt: '', quantity: '1', note: '',
}

export default function AssetsPage() {
  const { currentCohortId } = useCohortStore()
  const { assets, addAsset, updateAsset, deleteAsset, rentAsset, returnAsset } = useAssetStore()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [assetFormOpen, setAssetFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Asset | null>(null)
  const [assetForm, setAssetForm] = useState(defaultAssetForm)
  const [rentModalOpen, setRentModalOpen] = useState(false)
  const [rentForm, setRentForm] = useState(defaultRentForm)
  const [returnConfirm, setReturnConfirm] = useState<{ assetId: string; rental: RentalRecord } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const cohortAssets = useMemo(
    () => assets.filter((a) => a.cohortId === currentCohortId),
    [assets, currentCohortId]
  )

  const filtered = useMemo(() => {
    let list = [...cohortAssets]
    if (search) list = list.filter((a) => a.name.includes(search) || a.tags.some((t) => t.includes(search)))
    if (statusFilter) list = list.filter((a) => a.status === statusFilter)
    return list
  }, [cohortAssets, search, statusFilter])

  const openCreate = () => { setEditTarget(null); setAssetForm(defaultAssetForm); setAssetFormOpen(true) }
  const openEdit = (a: Asset) => {
    setEditTarget(a)
    setAssetForm({
      name: a.name, category: a.category,
      tags: a.tags.join(', '),
      photoUrl: a.photoUrl ?? '',
      quantity: String(a.quantity),
      purchasePrice: String(a.purchasePrice),
      location: a.location,
      description: a.description ?? '',
    })
    setAssetFormOpen(true)
  }

  const handleSave = () => {
    if (!assetForm.name) { toast.error('자산명을 입력해주세요.'); return }
    const qty = Number(assetForm.quantity) || 1
    const data = {
      cohortId: currentCohortId,
      name: assetForm.name,
      category: assetForm.category || '기타',
      tags: assetForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      photoUrl: assetForm.photoUrl || undefined,
      quantity: qty,
      availableQuantity: editTarget ? editTarget.availableQuantity : qty,
      purchasePrice: Number(assetForm.purchasePrice) || 0,
      location: assetForm.location,
      status: 'available' as const,
      description: assetForm.description || undefined,
    }
    if (editTarget) { updateAsset(editTarget.id, data); toast.success('자산 정보가 수정되었습니다.') }
    else { addAsset(data); toast.success('자산이 등록되었습니다.') }
    setAssetFormOpen(false)
  }

  const handleRent = () => {
    if (!selectedAsset) return
    if (!rentForm.borrowerName || !rentForm.rentedAt || !rentForm.dueAt) {
      toast.error('대여자명, 대여일, 반납 예정일은 필수입니다.')
      return
    }
    rentAsset(selectedAsset.id, {
      borrowerName: rentForm.borrowerName,
      studentId: rentForm.studentId,
      contact: rentForm.contact,
      rentedAt: rentForm.rentedAt,
      dueAt: rentForm.dueAt,
      quantity: Number(rentForm.quantity) || 1,
      note: rentForm.note || undefined,
    })
    const updated = assets.find((a) => a.id === selectedAsset.id)
    if (updated) setSelectedAsset({ ...updated })
    toast.success('대여 처리가 완료되었습니다.')
    setRentModalOpen(false)
    setRentForm(defaultRentForm)
  }

  const handleReturn = () => {
    if (!returnConfirm) return
    returnAsset(returnConfirm.assetId, returnConfirm.rental.id)
    toast.success('반납 처리가 완료되었습니다.')
    setReturnConfirm(null)
    if (selectedAsset) {
      const updated = assets.find((a) => a.id === selectedAsset.id)
      if (updated) setSelectedAsset({ ...updated })
    }
  }

  const statusBg: Record<string, string> = {
    available: 'bg-green-50 border-green-200',
    rented: 'bg-amber-50 border-amber-200',
    unavailable: 'bg-red-50 border-red-200',
  }

  return (
    <div>
      <PageHeader
        title="자산 관리"
        description="학생회 물품의 현황과 대여 상태를 관리합니다."
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} />
            자산 등록
          </button>
        }
      />

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="자산명, 태그 검색" className="input pl-8 w-48" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {[{ v: '', l: '전체' }, { v: 'available', l: '대여 가능' }, { v: 'rented', l: '대여 중' }, { v: 'unavailable', l: '사용 불가' }].map(({ v, l }) => (
            <button key={v} onClick={() => setStatusFilter(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {l}
            </button>
          ))}
        </div>
        {(search || statusFilter) && <button onClick={() => { setSearch(''); setStatusFilter('') }} className="text-xs text-slate-500 hover:text-slate-700 underline">초기화</button>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="자산이 없습니다." description="학생회 물품을 등록해보세요." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />자산 등록</button>} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <button
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`card p-4 text-left hover:shadow-md transition-all border ${statusBg[asset.status]}`}
            >
              {asset.photoUrl ? (
                <img src={asset.photoUrl} alt={asset.name} className="w-full h-28 object-cover rounded-lg mb-3" />
              ) : (
                <div className="w-full h-28 bg-slate-100 rounded-lg flex items-center justify-center mb-3 text-slate-300">
                  <Image size={28} />
                </div>
              )}
              <AssetStatusBadge status={asset.status} />
              <h3 className="text-sm font-semibold text-slate-900 mt-2 mb-1 truncate">{asset.name}</h3>
              <p className="text-xs text-slate-500 mb-2">{asset.location}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">재고 <strong>{asset.availableQuantity}</strong>/{asset.quantity}</span>
                <span className="text-xs text-slate-500">{asset.purchasePrice.toLocaleString()}원</span>
              </div>
              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {asset.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 자산 상세 Drawer */}
      <Drawer
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.name}
        width="w-[480px]"
        footer={
          <div className="flex gap-2">
            <button onClick={() => { if (selectedAsset) openEdit(selectedAsset) }} className="btn-secondary flex-1 justify-center">
              <Edit2 size={15} />수정
            </button>
            {selectedAsset && selectedAsset.availableQuantity > 0 && (
              <button onClick={() => setRentModalOpen(true)} className="btn-primary flex-1 justify-center">
                <ArrowRightLeft size={15} />대여
              </button>
            )}
          </div>
        }
      >
        {selectedAsset && (
          <div className="space-y-5">
            <AssetStatusBadge status={selectedAsset.status} />
            {selectedAsset.photoUrl && (
              <img src={selectedAsset.photoUrl} alt={selectedAsset.name} className="w-full rounded-xl object-cover" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500 text-xs">카테고리</p><p className="font-medium">{selectedAsset.category}</p></div>
              <div><p className="text-slate-500 text-xs">보관 위치</p><p className="font-medium">{selectedAsset.location}</p></div>
              <div><p className="text-slate-500 text-xs">총 수량</p><p className="font-medium">{selectedAsset.quantity}개</p></div>
              <div><p className="text-slate-500 text-xs">대여 가능</p><p className="font-medium text-green-600">{selectedAsset.availableQuantity}개</p></div>
              <div className="col-span-2"><p className="text-slate-500 text-xs">구매가</p><p className="font-medium">{selectedAsset.purchasePrice.toLocaleString()}원</p></div>
            </div>
            {selectedAsset.description && (
              <div><p className="text-xs text-slate-500 mb-1">설명</p><p className="text-sm text-slate-700">{selectedAsset.description}</p></div>
            )}
            {selectedAsset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedAsset.tags.map((t) => (
                  <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
            {/* 대여 이력 */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">대여 이력</h4>
              {selectedAsset.rentalHistory.length === 0 ? (
                <p className="text-xs text-slate-400">대여 이력이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {[...selectedAsset.rentalHistory].reverse().map((r) => (
                    <div key={r.id} className={`p-3 rounded-xl border text-xs ${r.returnedAt ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{r.borrowerName}</span>
                        <span className={`px-1.5 py-0.5 rounded-md font-medium ${r.returnedAt ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.returnedAt ? '반납 완료' : '대여 중'}
                        </span>
                      </div>
                      <p className="text-slate-500">{r.studentId} · {r.contact}</p>
                      <p className="text-slate-500">대여: {r.rentedAt} → 반납 예정: {r.dueAt}</p>
                      {r.returnedAt && <p className="text-green-700">반납일: {r.returnedAt}</p>}
                      {!r.returnedAt && (
                        <button onClick={() => setReturnConfirm({ assetId: selectedAsset.id, rental: r })}
                          className="mt-1.5 text-amber-700 hover:underline font-medium">
                          반납 처리
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* 자산 등록/수정 모달 */}
      <Modal open={assetFormOpen} onClose={() => setAssetFormOpen(false)} title={editTarget ? '자산 수정' : '자산 등록'} size="lg"
        footer={<><button onClick={() => setAssetFormOpen(false)} className="btn-secondary">취소</button><button onClick={handleSave} className="btn-primary">저장</button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">자산명 *</label><input type="text" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} className="input" /></div>
          <div><label className="label">카테고리</label><input type="text" value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} className="input" /></div>
          <div><label className="label">보관 위치</label><input type="text" value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} className="input" /></div>
          <div><label className="label">수량</label><input type="number" value={assetForm.quantity} onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })} className="input" /></div>
          <div><label className="label">구매가</label><input type="number" value={assetForm.purchasePrice} onChange={(e) => setAssetForm({ ...assetForm, purchasePrice: e.target.value })} className="input" /></div>
          <div className="col-span-2"><label className="label">태그 (쉼표 구분)</label><input type="text" value={assetForm.tags} onChange={(e) => setAssetForm({ ...assetForm, tags: e.target.value })} placeholder="예: 행사, 음향" className="input" /></div>
          <div className="col-span-2"><label className="label">사진 URL (더미)</label><input type="text" value={assetForm.photoUrl} onChange={(e) => setAssetForm({ ...assetForm, photoUrl: e.target.value })} className="input" /></div>
          <div className="col-span-2"><label className="label">설명</label><textarea rows={2} value={assetForm.description} onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })} className="textarea" /></div>
        </div>
      </Modal>

      {/* 대여 모달 */}
      <Modal open={rentModalOpen} onClose={() => setRentModalOpen(false)} title="대여 처리" size="md"
        footer={<><button onClick={() => setRentModalOpen(false)} className="btn-secondary">취소</button><button onClick={handleRent} className="btn-primary">대여</button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">대여자명 *</label><input type="text" value={rentForm.borrowerName} onChange={(e) => setRentForm({ ...rentForm, borrowerName: e.target.value })} className="input" /></div>
          <div><label className="label">학번</label><input type="text" value={rentForm.studentId} onChange={(e) => setRentForm({ ...rentForm, studentId: e.target.value })} className="input" /></div>
          <div><label className="label">연락처</label><input type="text" value={rentForm.contact} onChange={(e) => setRentForm({ ...rentForm, contact: e.target.value })} className="input" /></div>
          <div><label className="label">수량</label><input type="number" value={rentForm.quantity} onChange={(e) => setRentForm({ ...rentForm, quantity: e.target.value })} className="input" /></div>
          <div><label className="label">대여일 *</label><input type="date" value={rentForm.rentedAt} onChange={(e) => setRentForm({ ...rentForm, rentedAt: e.target.value })} className="input" /></div>
          <div><label className="label">반납 예정일 *</label><input type="date" value={rentForm.dueAt} onChange={(e) => setRentForm({ ...rentForm, dueAt: e.target.value })} className="input" /></div>
          <div className="col-span-2"><label className="label">비고</label><input type="text" value={rentForm.note} onChange={(e) => setRentForm({ ...rentForm, note: e.target.value })} className="input" /></div>
        </div>
      </Modal>

      {/* 반납 확인 */}
      <Modal open={!!returnConfirm} onClose={() => setReturnConfirm(null)} title="반납 처리" size="sm"
        footer={<><button onClick={() => setReturnConfirm(null)} className="btn-secondary">취소</button><button onClick={handleReturn} className="btn-primary">반납 처리</button></>}
      >
        <p className="text-sm text-slate-600"><strong>{returnConfirm?.rental.borrowerName}</strong>님이 대여한 물품을 반납 처리하시겠습니까?</p>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="삭제" size="sm"
        footer={<><button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button><button onClick={() => { deleteConfirm && deleteAsset(deleteConfirm); toast.success('삭제되었습니다.'); setDeleteConfirm(null); setSelectedAsset(null) }} className="btn-danger">삭제</button></>}
      >
        <p className="text-sm text-slate-600">이 자산을 삭제하시겠습니까?</p>
      </Modal>
    </div>
  )
}
