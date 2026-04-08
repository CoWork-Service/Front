import React from 'react'
import { Calendar } from 'lucide-react'

interface DueDateBadgeProps {
  dueDate?: string
  status?: 'open' | 'done'
}

function getDueDateState(dueDate: string, isDone: boolean) {
  if (isDone) return 'done'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  return 'upcoming'
}

export function DueDateBadge({ dueDate, status }: DueDateBadgeProps) {
  if (!dueDate) return null

  const isDone = status === 'done'
  const state = getDueDateState(dueDate, isDone)

  const stateStyles = {
    done: 'text-slate-400',
    overdue: 'text-red-600 font-medium',
    today: 'text-amber-600 font-medium',
    upcoming: 'text-slate-500',
  }

  const label = {
    done: dueDate,
    overdue: `${dueDate} (기한 초과)`,
    today: `${dueDate} (오늘 마감)`,
    upcoming: dueDate,
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${stateStyles[state]}`}>
      <Calendar size={12} />
      {label[state]}
    </span>
  )
}
