import React from 'react'

type Variant = 'green' | 'blue' | 'red' | 'orange' | 'gray' | 'navy' | 'purple'

interface StatusBadgeProps {
  label: string
  variant: Variant
  size?: 'sm' | 'md'
}

const variantClasses: Record<Variant, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  orange: 'bg-amber-50 text-amber-700 border-amber-200',
  gray: 'bg-slate-100 text-slate-600 border-slate-200',
  navy: 'bg-blue-900 text-white border-blue-900',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function StatusBadge({ label, variant, size = 'sm' }: StatusBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeClass} ${variantClasses[variant]}`}
    >
      {label}
    </span>
  )
}

// 헬퍼: 설문 상태
export function SurveyStatusBadge({ status }: { status: string }) {
  if (status === 'open') return <StatusBadge label="진행중" variant="blue" />
  if (status === 'draft') return <StatusBadge label="작성중" variant="orange" />
  if (status === 'closed') return <StatusBadge label="마감" variant="gray" />
  return null
}

// 헬퍼: 자산 상태
export function AssetStatusBadge({ status }: { status: string }) {
  if (status === 'available') return <StatusBadge label="대여 가능" variant="green" />
  if (status === 'rented') return <StatusBadge label="대여 중" variant="orange" />
  if (status === 'unavailable') return <StatusBadge label="사용 불가" variant="red" />
  return null
}

// 헬퍼: 납부 상태
export function PaymentStatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <StatusBadge label="납부" variant="green" />
  return <StatusBadge label="미납" variant="red" />
}

// 헬퍼: 타임테이블 상태
export function TimetableStatusBadge({ status }: { status: string }) {
  if (status === 'open') return <StatusBadge label="진행중" variant="blue" />
  return <StatusBadge label="마감" variant="gray" />
}

// 헬퍼: 메모 우선순위
export function MemoPriorityBadge({ priority }: { priority: string }) {
  if (priority === 'important') return <StatusBadge label="중요" variant="red" />
  return <StatusBadge label="일반" variant="gray" />
}

// 헬퍼: 메모 완료
export function MemoStatusBadge({ status }: { status: string }) {
  if (status === 'done') return <StatusBadge label="완료" variant="green" />
  return <StatusBadge label="진행중" variant="blue" />
}
