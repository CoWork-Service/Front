import { apiRequest, buildApiPath } from './api'
import { getApiBaseUrl } from './auth'
import type {
  Asset,
  AssetStatus,
  BudgetCategory,
  Cohort,
  CoworkEvent,
  Department,
  EventCategory,
  EventPhoto,
  EventPhotoTag,
  EventStatus,
  Expense,
  FileItem,
  FileLog,
  FileLogAction,
  Memo,
  Meeting,
  MeetingAttachment,
  PaymentMethod,
  PaymentStatus,
  Question,
  QuestionType,
  RentalRecord,
  Student,
  Survey,
  SurveyResponse,
  SurveyStatus,
  Timetable,
  TimetableResponse,
  TimetableStatus,
  TimeSlot,
  Workspace,
} from '../types'

export function resolveResourceUrl(url?: string | null) {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${getApiBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`
}

const DEPARTMENT_VALUES: Department[] = ['전체', '회장단', '총무부', '복지국', '기획국', '홍보국', '대외협력', '기타']

export function toDepartment(value?: string | null): Department | undefined {
  if (!value) return undefined
  return DEPARTMENT_VALUES.includes(value as Department) ? (value as Department) : '기타'
}

export function toApiStatus(value?: string | null) {
  return value ? value.toUpperCase() : undefined
}

export type ApiEvent = {
  id: number
  cohortId: number
  name: string
  category: string
  status: string
  description?: string | null
  startDate: string
  endDate: string
  location?: string | null
  leadDepartment?: string | null
  organizers?: string[] | null
  budget?: number | null
  coverColor?: string | null
  createdBy?: number | string | null
  createdAt: string
  updatedAt: string
}

export type ApiEventDetail = {
  event: ApiEvent
  photos: ApiEventPhoto[]
}

export type ApiEventPhoto = {
  id: number
  photoUrl?: string | null
  url?: string | null
  caption?: string | null
  tag?: string | null
  uploadedBy?: number | string | null
  uploadedAt: string
}

export function toEvent(item: ApiEvent, photos?: ApiEventPhoto[]): CoworkEvent {
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    name: item.name,
    category: (item.category || '기타') as EventCategory,
    status: eventStatus(item.status),
    description: item.description ?? undefined,
    startDate: item.startDate,
    endDate: item.endDate,
    location: item.location ?? undefined,
    leadDepartment: toDepartment(item.leadDepartment) ?? '기타',
    organizers: item.organizers ?? [],
    budget: item.budget ?? undefined,
    coverColor: normalizeCoverColor(item.coverColor),
    photos: photos?.map(toEventPhoto),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdBy: item.createdBy ? String(item.createdBy) : '',
  }
}

export function eventToApiPayload(event: Partial<CoworkEvent>) {
  return {
    cohortId: event.cohortId ? Number(event.cohortId) : undefined,
    name: event.name,
    category: event.category,
    status: event.status,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    leadDepartment: event.leadDepartment === '전체' ? undefined : event.leadDepartment,
    organizers: event.organizers ?? [],
    budget: event.budget,
    coverColor: event.coverColor,
  }
}

export function toEventPhoto(photo: ApiEventPhoto): EventPhoto {
  return {
    id: String(photo.id),
    url: resolveResourceUrl(photo.url ?? photo.photoUrl) ?? '',
    caption: photo.caption ?? undefined,
    tag: normalizePhotoTag(photo.tag),
    uploadedBy: photo.uploadedBy ? String(photo.uploadedBy) : '',
    uploadedAt: photo.uploadedAt,
  }
}

function eventStatus(value?: string | null): EventStatus {
  const normalized = value?.toLowerCase()
  if (normalized === 'planning' || normalized === 'ongoing' || normalized === 'done' || normalized === 'cancelled') {
    return normalized
  }
  if (value === 'PLANNING') return 'planning'
  if (value === 'ONGOING' || value === 'IN_PROGRESS') return 'ongoing'
  if (value === 'DONE' || value === 'COMPLETED') return 'done'
  if (value === 'CANCELLED' || value === 'CANCELED') return 'cancelled'
  return 'planning'
}

function normalizeCoverColor(value?: string | null) {
  if (!value) return undefined
  if (value.startsWith('#')) return 'blue'
  return value
}

function normalizePhotoTag(value?: string | null): EventPhotoTag | undefined {
  if (!value) return undefined
  if (value === '행사사진' || value === '증빙사진' || value === '준비과정' || value === '기타') return value
  if (value.includes('증빙')) return '증빙사진'
  if (value.includes('준비')) return '준비과정'
  if (value.includes('행사') || value.includes('현장')) return '행사사진'
  return '기타'
}

export type ApiMemo = {
  id: number
  cohortId: number
  title: string
  content?: string | null
  department?: string | null
  priority: string
  status: string
  dueDate?: string | null
  author?: string | null
  createdAt: string
  updatedAt: string
}

export function toMemo(item: ApiMemo): Memo {
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    title: item.title,
    content: item.content ?? '',
    department: toDepartment(item.department),
    dueDate: item.dueDate ?? undefined,
    priority: item.priority === 'IMPORTANT' ? 'important' : 'normal',
    status: item.status === 'DONE' ? 'done' : 'open',
    author: item.author ?? '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export function memoToApiPayload(memo: Partial<Memo>) {
  return {
    cohortId: memo.cohortId ? Number(memo.cohortId) : undefined,
    title: memo.title,
    content: memo.content,
    department: memo.department === '전체' ? undefined : memo.department,
    priority: memo.priority === 'important' ? 'IMPORTANT' : 'NORMAL',
    status: memo.status === 'done' ? 'DONE' : 'OPEN',
    dueDate: memo.dueDate,
  }
}

export type ApiFileItem = {
  id: number
  cohortId: number
  name: string
  type: string
  mimeType?: string | null
  size?: number | null
  parentId?: number | null
  department?: string | null
  uploadedBy?: string | null
  eventId?: number | null
  downloadUrl?: string | null
  previewUrl?: string | null
  createdAt?: string
  updatedAt: string
}

export type ApiFileDetail = {
  file: ApiFileItem
  logs: ApiFileLog[]
}

export type ApiFileLog = {
  id: number
  action: string
  actorName?: string | null
  detail?: Record<string, unknown> | null
  createdAt: string
}

export function toFileItem(item: ApiFileItem, logs: ApiFileLog[] = []): FileItem {
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    name: item.name,
    type: item.type === 'FOLDER' ? 'folder' : 'file',
    mimeType: item.mimeType ?? undefined,
    size: item.size ?? undefined,
    parentId: item.parentId ? String(item.parentId) : undefined,
    path: item.name,
    department: toDepartment(item.department),
    uploadedBy: item.uploadedBy ?? undefined,
    updatedAt: item.updatedAt,
    logs: logs.map(toFileLog),
    previewUrl: resolveResourceUrl(item.previewUrl),
    eventId: item.eventId ? String(item.eventId) : undefined,
  }
}

export function toFileLog(log: ApiFileLog): FileLog {
  return {
    id: String(log.id),
    action: log.action.toLowerCase() as FileLogAction,
    actor: log.actorName ?? '',
    timestamp: log.createdAt,
    detail: log.detail ? JSON.stringify(log.detail) : undefined,
  }
}

export type ApiExpense = {
  id: number
  cohortId: number
  date: string
  department: string
  category: string
  vendor: string
  description?: string | null
  amount: number
  paymentMethod: string
  receiptUrl?: string | null
  photoIds?: number[] | null
  note?: string | null
  eventId?: number | null
  createdAt: string
}

export function toExpense(item: ApiExpense): Expense {
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    date: item.date,
    department: toDepartment(item.department) ?? '기타',
    category: item.category as BudgetCategory,
    vendor: item.vendor,
    description: item.description ?? '',
    amount: item.amount,
    paymentMethod: item.paymentMethod as PaymentMethod,
    receiptUrl: resolveResourceUrl(item.receiptUrl),
    photoIds: item.photoIds?.map(String),
    note: item.note ?? undefined,
    createdAt: item.createdAt,
    eventId: item.eventId ? String(item.eventId) : undefined,
  }
}

export type ApiAsset = {
  id: number
  cohortId: number
  name: string
  category?: string | null
  tags?: string[] | null
  photoUrl?: string | null
  quantity?: number | null
  availableQuantity?: number | null
  purchasePrice?: number | null
  location?: string | null
  status: string
  description?: string | null
  createdAt: string
}

export type ApiAssetDetail = {
  asset: ApiAsset
  rentals: ApiRental[]
}

export type ApiRental = {
  id: number
  assetId: number
  borrowerName: string
  studentId?: string | null
  managerName?: string | null
  idCardSubmitted?: boolean | null
  rentedAt: string
  dueAt: string
  returnedAt?: string | null
  quantity?: number | null
  note?: string | null
}

export function toAsset(item: ApiAsset, rentals: ApiRental[] = []): Asset {
  const status = item.status === 'RENTED' ? 'rented' : item.status === 'UNAVAILABLE' || item.status === 'MAINTENANCE' || item.status === 'DISPOSED' ? 'unavailable' : 'available'
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    name: item.name,
    category: item.category ?? '기타',
    tags: item.tags ?? [],
    photoUrl: resolveResourceUrl(item.photoUrl),
    quantity: item.quantity ?? 1,
    availableQuantity: item.availableQuantity ?? item.quantity ?? 1,
    purchasePrice: item.purchasePrice ?? 0,
    location: item.location ?? '',
    status,
    description: item.description ?? undefined,
    rentalHistory: rentals.map(toRental),
    createdAt: item.createdAt,
  }
}

export function toRental(item: ApiRental): RentalRecord {
  return {
    id: String(item.id),
    borrowerName: item.borrowerName,
    studentId: item.studentId ?? '',
    managerName: item.managerName ?? undefined,
    idCardSubmitted: Boolean(item.idCardSubmitted),
    rentedAt: item.rentedAt.slice(0, 10),
    dueAt: item.dueAt.slice(0, 10),
    returnedAt: item.returnedAt?.slice(0, 10) ?? undefined,
    quantity: item.quantity ?? 1,
    note: item.note ?? undefined,
  }
}

export function assetStatusToApi(status?: AssetStatus) {
  if (status === 'rented') return 'RENTED'
  if (status === 'unavailable') return 'UNAVAILABLE'
  return 'AVAILABLE'
}

export type ApiStudent = {
  id: number
  cohortId: number
  studentNumber?: string | null
  studentId?: string | null
  name: string
  department?: string | null
  grade?: number | null
  paymentStatus: string
  paidAt?: string | null
  note?: string | null
}

export function toStudent(item: ApiStudent): Student {
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    studentId: item.studentId ?? item.studentNumber ?? '',
    name: item.name,
    department: item.department ?? '',
    grade: item.grade ?? 1,
    paymentStatus: item.paymentStatus === 'PAID' ? 'paid' : 'unpaid',
    paidAt: item.paidAt?.slice(0, 10) ?? undefined,
    note: item.note ?? undefined,
  }
}

export function paymentStatusToApi(status: PaymentStatus) {
  return status === 'paid' ? 'PAID' : 'UNPAID'
}

export type ApiSurveySummary = {
  id: number
  cohortId: number
  title: string
  description?: string | null
  status: string
  createdBy?: number | string | null
  eventId?: number | null
  createdAt: string
  updatedAt: string
}

export type ApiSurveyDetail = {
  survey: ApiSurveySummary
  questions: ApiQuestion[]
  responses: ApiSurveyResponse[]
}

export type ApiQuestion = {
  id: number
  orderIndex: number
  title: string
  type: string
  required: boolean
  options?: ApiQuestionOption[] | null
}

export type ApiQuestionOption = {
  id: number
  orderIndex: number
  label: string
}

export type ApiSurveyResponse = {
  id: number
  submittedAt: string
  answers: ApiSurveyAnswer[]
}

export type ApiSurveyAnswer = {
  questionId: number
  answerText?: string | null
  selectedOptionIds?: number[] | null
}

export function toSurvey(detailOrSummary: ApiSurveySummary | ApiSurveyDetail): Survey {
  const summary = 'survey' in detailOrSummary ? detailOrSummary.survey : detailOrSummary
  const questions = 'questions' in detailOrSummary ? detailOrSummary.questions.map(toQuestion) : []
  return {
    id: String(summary.id),
    cohortId: String(summary.cohortId),
    title: summary.title,
    description: summary.description ?? undefined,
    status: summary.status.toLowerCase() as SurveyStatus,
    questions,
    responses: 'responses' in detailOrSummary ? detailOrSummary.responses.map((response) => toSurveyResponse(response, questions)) : [],
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
    createdBy: summary.createdBy ? String(summary.createdBy) : '',
    eventId: summary.eventId ? String(summary.eventId) : undefined,
  }
}

export function toQuestion(question: ApiQuestion): Question {
  return {
    id: String(question.id),
    order: question.orderIndex,
    title: question.title,
    type: questionTypeFromApi(question.type),
    required: question.required,
    options: question.options?.map((option) => ({ id: String(option.id), text: option.label })) ?? [],
  }
}

function toSurveyResponse(response: ApiSurveyResponse, questions: Question[]): SurveyResponse {
  const answers: Record<string, string | string[]> = {}
  response.answers?.forEach((answer) => {
    const questionId = String(answer.questionId)
    const question = questions.find((item) => item.id === questionId)
    if (answer.selectedOptionIds?.length) {
      const selected = answer.selectedOptionIds.map(String)
      answers[questionId] = question?.type === 'multiple_choice' || question?.type === 'dropdown' ? selected[0] : selected
    } else {
      answers[questionId] = answer.answerText ?? ''
    }
  })
  return {
    id: String(response.id),
    respondedAt: response.submittedAt,
    answers,
  }
}

export function questionTypeFromApi(type: string): QuestionType {
  if (type === 'SHORT_TEXT') return 'short_text'
  if (type === 'LONG_TEXT') return 'long_text'
  if (type === 'CHECKBOX') return 'checkbox'
  if (type === 'DROPDOWN') return 'dropdown'
  return 'multiple_choice'
}

export function questionTypeToApi(type: QuestionType) {
  if (type === 'short_text') return 'SHORT_TEXT'
  if (type === 'long_text') return 'LONG_TEXT'
  if (type === 'checkbox') return 'CHECKBOX'
  if (type === 'dropdown') return 'DROPDOWN'
  return 'MULTIPLE_CHOICE'
}

export type ApiTimetableSummary = {
  id: number
  cohortId: number
  title: string
  description?: string | null
  dateRangeStart: string
  dateRangeEnd: string
  timeRangeStart: string
  timeRangeEnd: string
  slotMinutes: number
  status: string
  createdBy?: number | string | null
  eventId?: number | null
  createdAt: string
}

export type ApiTimetableDetail = {
  timetable: ApiTimetableSummary
  participants: { id: number; name: string; responded: boolean }[]
  responses: ApiTimetableResponse[]
}

export type ApiTimetableResponse = {
  id: number
  participantName: string
  selectedSlots: TimeSlot[]
  submittedAt: string
}

export function toTimetable(itemOrDetail: ApiTimetableSummary | ApiTimetableDetail): Timetable {
  const item = 'timetable' in itemOrDetail ? itemOrDetail.timetable : itemOrDetail
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    title: item.title,
    description: item.description ?? undefined,
    dateRange: { start: item.dateRangeStart, end: item.dateRangeEnd },
    timeRange: { start: item.timeRangeStart.slice(0, 5), end: item.timeRangeEnd.slice(0, 5) },
    slotMinutes: item.slotMinutes === 60 ? 60 : 30,
    participants: 'participants' in itemOrDetail ? itemOrDetail.participants.map((participant) => participant.name) : [],
    status: item.status.toLowerCase() as TimetableStatus,
    responses: 'responses' in itemOrDetail ? itemOrDetail.responses.map(toTimetableResponse) : [],
    createdBy: item.createdBy ? String(item.createdBy) : '',
    createdAt: item.createdAt,
    eventId: item.eventId ? String(item.eventId) : undefined,
  }
}

function toTimetableResponse(item: ApiTimetableResponse): TimetableResponse {
  return {
    id: String(item.id),
    participantName: item.participantName,
    availableSlots: item.selectedSlots,
    respondedAt: item.submittedAt,
  }
}

export type ApiWorkspace = {
  id: number
  cohortId: number
  department: string
  name: string
  description?: string | null
  fileCount: number
  meetingCount: number
  updatedAt: string
}

export type ApiWorkspaceDetail = {
  workspace: ApiWorkspace
  meetings: ApiMeeting[]
}

export type ApiMeeting = {
  id: number
  workspaceId: number
  title: string
  date: string
  attendees?: string[] | null
  agenda?: string | null
  content?: string | null
  attachments?: ApiMeetingAttachment[] | null
  createdBy?: number | string | null
  createdAt: string
  updatedAt: string
  eventId?: number | null
}

export type ApiMeetingAttachment = {
  id: number
  name: string
  storagePath?: string | null
  size?: number | null
}

export function toWorkspace(item: ApiWorkspace, meetings: ApiMeeting[] = []): Workspace {
  return {
    id: String(item.id),
    cohortId: String(item.cohortId),
    departmentId: toDepartment(item.department) ?? '전체',
    name: item.name,
    description: item.description ?? undefined,
    fileCount: item.fileCount,
    meetingCount: item.meetingCount,
    updatedAt: item.updatedAt,
    meetings: meetings.map(toMeeting),
  }
}

export function toMeeting(item: ApiMeeting): Meeting {
  return {
    id: String(item.id),
    workspaceId: String(item.workspaceId),
    title: item.title,
    date: item.date,
    attendees: item.attendees ?? [],
    agenda: item.agenda ?? '',
    content: item.content ?? '',
    attachments: item.attachments?.map(toMeetingAttachment) ?? [],
    createdBy: item.createdBy ? String(item.createdBy) : '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    eventId: item.eventId ? String(item.eventId) : undefined,
  }
}

function toMeetingAttachment(item: ApiMeetingAttachment): MeetingAttachment {
  return {
    id: String(item.id),
    name: item.name,
    url: resolveResourceUrl(item.storagePath ? `/uploads/${item.storagePath}` : undefined) ?? '',
    size: item.size ?? 0,
  }
}

export async function fetchCohorts() {
  return (await apiRequest<Cohort[]>('/api/cohorts')).map((cohort) => ({ ...cohort, id: String(cohort.id) }))
}

export async function fetchEvents(cohortId: string) {
  const events = await apiRequest<ApiEvent[]>(buildApiPath('/api/events', { cohortId }))
  return events.map((event) => toEvent(event))
}

export async function fetchEventDetail(id: string) {
  const detail = await apiRequest<ApiEventDetail>(`/api/events/${id}`)
  return toEvent(detail.event, detail.photos)
}

export async function fetchMemos(cohortId: string) {
  return (await apiRequest<ApiMemo[]>(buildApiPath('/api/memos', { cohortId }))).map(toMemo)
}

export async function fetchFiles(cohortId: string) {
  return (await apiRequest<ApiFileItem[]>(buildApiPath('/api/files', { cohortId }))).map((file) => toFileItem(file))
}

export async function fetchExpenses(cohortId: string) {
  return (await apiRequest<ApiExpense[]>(buildApiPath('/api/expenses', { cohortId }))).map(toExpense)
}

export async function fetchAssets(cohortId: string) {
  const assets = await apiRequest<ApiAsset[]>(buildApiPath('/api/assets', { cohortId }))
  const details = await Promise.allSettled(assets.map((asset) => apiRequest<ApiAssetDetail>(`/api/assets/${asset.id}`)))
  return assets.map((asset, index) => {
    const detail = details[index]
    return toAsset(asset, detail.status === 'fulfilled' ? detail.value.rentals : [])
  })
}

export async function fetchStudents(cohortId: string) {
  return (await apiRequest<ApiStudent[]>(buildApiPath('/api/students', { cohortId }))).map(toStudent)
}

export async function fetchSurveys(cohortId: string) {
  const summaries = await apiRequest<ApiSurveySummary[]>(buildApiPath('/api/surveys', { cohortId }))
  const details = await Promise.allSettled(summaries.map((summary) => apiRequest<ApiSurveyDetail>(`/api/surveys/${summary.id}`)))
  return summaries.map((summary, index) => {
    const detail = details[index]
    return detail.status === 'fulfilled' ? toSurvey(detail.value) : toSurvey(summary)
  })
}

export async function fetchSchedules(cohortId: string) {
  const summaries = await apiRequest<ApiTimetableSummary[]>(buildApiPath('/api/timetables', { cohortId }))
  const details = await Promise.allSettled(summaries.map((summary) => apiRequest<ApiTimetableDetail>(`/api/timetables/${summary.id}`)))
  return summaries.map((summary, index) => {
    const detail = details[index]
    return detail.status === 'fulfilled' ? toTimetable(detail.value) : toTimetable(summary)
  })
}

export async function fetchWorkspaces(cohortId: string) {
  const summaries = await apiRequest<ApiWorkspace[]>(buildApiPath('/api/workspaces', { cohortId }))
  const details = await Promise.allSettled(summaries.map((summary) => apiRequest<ApiWorkspaceDetail>(`/api/workspaces/${summary.id}`)))
  return summaries.map((summary, index) => {
    const detail = details[index]
    return detail.status === 'fulfilled' ? toWorkspace(detail.value.workspace, detail.value.meetings) : toWorkspace(summary)
  })
}
