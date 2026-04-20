// ==================== 공통 ====================

export type Department =
  | '전체'
  | '회장단'
  | '총무부'
  | '복지국'
  | '기획국'
  | '홍보국'
  | '대외협력'
  | '기타'

export const DEPARTMENTS: Department[] = [
  '회장단', '총무부', '복지국', '기획국', '홍보국', '대외협력', '기타',
]

export type Cohort = {
  id: string
  label: string // '2026 기수'
  year: number
}

// ==================== 인계 메모 ====================

export type MemoPriority = 'normal' | 'important'
export type MemoStatus = 'open' | 'done'

export type Memo = {
  id: string
  cohortId: string
  title: string
  content: string
  department?: Department
  dueDate?: string
  priority: MemoPriority
  status: MemoStatus
  author: string
  createdAt: string
  updatedAt: string
}

// ==================== 파일 관리 ====================

export type FileLogAction = 'upload' | 'update' | 'rename' | 'move' | 'delete'

export type FileLog = {
  id: string
  action: FileLogAction
  actor: string
  timestamp: string
  detail?: string
}

export type FileItem = {
  id: string
  cohortId: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  size?: number // bytes
  parentId?: string
  path: string
  department?: Department
  uploadedBy?: string
  updatedAt: string
  logs: FileLog[]
  previewUrl?: string
  eventId?: string
}

// ==================== 예산 처리 ====================

export type PaymentMethod = '법인카드' | '개인카드' | '현금' | '계좌이체'

export type BudgetCategory = '행사비' | '소모품' | '식대' | '인쇄비' | '기타'

export type Expense = {
  id: string
  cohortId: string
  date: string
  department: Department
  category: BudgetCategory
  vendor: string
  description: string
  amount: number
  paymentMethod: PaymentMethod
  receiptUrl?: string
  photoIds?: string[]  // EventPhoto.id 참조
  note?: string
  createdAt: string
  eventId?: string
}

// ==================== 자산 관리 ====================

export type AssetStatus = 'available' | 'rented' | 'unavailable'

export type RentalRecord = {
  id: string
  borrowerName: string
  studentId: string
  contact: string
  rentedAt: string
  dueAt: string
  returnedAt?: string
  quantity: number
  note?: string
  eventId?: string
}

export type Asset = {
  id: string
  cohortId: string
  name: string
  category: string
  tags: string[]
  photoUrl?: string
  quantity: number
  availableQuantity: number
  purchasePrice: number
  location: string
  status: AssetStatus
  description?: string
  rentalHistory: RentalRecord[]
  createdAt: string
}

// ==================== 학생 관리 ====================

export type PaymentStatus = 'paid' | 'unpaid'

export type Student = {
  id: string
  cohortId: string
  studentId: string // 학번
  name: string
  department: string // 학부/전공
  grade: number // 학년
  paymentStatus: PaymentStatus
  paidAt?: string
  note?: string
}

// ==================== 설문 조사 ====================

export type SurveyStatus = 'draft' | 'open' | 'closed'

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'

export type QuestionOption = {
  id: string
  text: string
}

export type Question = {
  id: string
  order: number
  title: string
  type: QuestionType
  required: boolean
  options?: QuestionOption[]
}

export type SurveyResponse = {
  id: string
  respondedAt: string
  answers: Record<string, string | string[]>
}

export type Survey = {
  id: string
  cohortId: string
  title: string
  description?: string
  status: SurveyStatus
  questions: Question[]
  responses: SurveyResponse[]
  createdAt: string
  updatedAt: string
  createdBy: string
  eventId?: string
}

// ==================== 워크스페이스 ====================

export type MeetingAttachment = {
  id: string
  name: string
  url: string
  size: number
}

export type Meeting = {
  id: string
  workspaceId: string
  title: string
  date: string
  attendees: string[]
  agenda: string
  content: string
  attachments: MeetingAttachment[]
  createdBy: string
  createdAt: string
  updatedAt: string
  eventId?: string
}

export type Workspace = {
  id: string
  cohortId: string
  departmentId: Department
  name: string
  description?: string
  fileCount: number
  meetingCount: number
  updatedAt: string
  meetings: Meeting[]
}

// ==================== 타임테이블 ====================

export type TimetableStatus = 'open' | 'closed'

export type TimeSlot = {
  date: string // YYYY-MM-DD
  time: string // HH:MM
}

export type TimetableResponse = {
  id: string
  participantName: string
  availableSlots: TimeSlot[]
  respondedAt: string
}

export type Timetable = {
  id: string
  cohortId: string
  title: string
  description?: string
  dateRange: { start: string; end: string }
  timeRange: { start: string; end: string }
  slotMinutes: 30 | 60
  participants: string[]
  status: TimetableStatus
  responses: TimetableResponse[]
  createdBy: string
  createdAt: string
  eventId?: string
}

// ==================== 행사 ====================

export type EventStatus = 'planning' | 'ongoing' | 'done' | 'cancelled'

export type EventCategory =
  | 'OT'
  | '정기총회'
  | 'MT'
  | '체육대회'
  | '축제'
  | '간담회'
  | '기타'

export type EventPhotoTag = '행사사진' | '증빙사진' | '준비과정' | '기타'

export type EventPhoto = {
  id: string
  url: string
  caption?: string
  tag?: EventPhotoTag
  uploadedBy: string
  uploadedAt: string
}

export type CoworkEvent = {
  id: string
  cohortId: string
  name: string
  category: EventCategory
  status: EventStatus
  description?: string
  startDate: string
  endDate: string
  location?: string
  leadDepartment: Department
  organizers: string[]
  budget?: number
  coverColor?: string
  photos?: EventPhoto[]
  createdAt: string
  updatedAt: string
  createdBy: string
}
