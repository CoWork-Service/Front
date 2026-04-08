import React from 'react'
import type { Department } from '../../types'

const colorMap: Record<string, string> = {
  '전체': 'bg-blue-600 text-white',
  '회장단': 'bg-blue-100 text-blue-800',
  '총무부': 'bg-green-100 text-green-800',
  '복지국': 'bg-purple-100 text-purple-800',
  '기획국': 'bg-orange-100 text-orange-800',
  '홍보국': 'bg-pink-100 text-pink-800',
  '대외협력': 'bg-teal-100 text-teal-800',
  '기타': 'bg-slate-100 text-slate-700',
}

interface DepartmentTagProps {
  department: string
  size?: 'sm' | 'md'
}

export function DepartmentTag({ department, size = 'sm' }: DepartmentTagProps) {
  const color = colorMap[department] ?? 'bg-slate-100 text-slate-700'
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${color}`}>
      {department}
    </span>
  )
}
