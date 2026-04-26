import type { Student } from '../types'

const majors = ['AI소프트웨어학부', '소프트웨어학부', 'AI융합학부']

export const students: Student[] = [
  { id: 'stu-1', cohortId: '1', studentId: '20260001', name: '김민준', department: 'AI소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-05', note: '회장' },
  { id: 'stu-2', cohortId: '1', studentId: '20260002', name: '이서연', department: '소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-05', note: '총무부장' },
  { id: 'stu-3', cohortId: '1', studentId: '20260003', name: '박지훈', department: 'AI융합학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-03-06' },
  { id: 'stu-4', cohortId: '1', studentId: '20260004', name: '최예은', department: 'AI소프트웨어학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-03-06' },
  { id: 'stu-5', cohortId: '1', studentId: '20260005', name: '정다은', department: '소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-07' },
  { id: 'stu-6', cohortId: '1', studentId: '20260006', name: '윤성호', department: 'AI융합학부', grade: 3, paymentStatus: 'paid', paidAt: '2026-03-08' },
  { id: 'stu-7', cohortId: '1', studentId: '20260007', name: '한지원', department: 'AI소프트웨어학부', grade: 2, paymentStatus: 'unpaid', note: '연락 안됨' },
  { id: 'stu-8', cohortId: '1', studentId: '20260008', name: '오승현', department: '소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-10' },
  { id: 'stu-9', cohortId: '1', studentId: '20260009', name: '임수아', department: 'AI융합학부', grade: 3, paymentStatus: 'unpaid' },
  { id: 'stu-10', cohortId: '1', studentId: '20260010', name: '강도윤', department: 'AI소프트웨어학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-03-12' },
  { id: 'stu-11', cohortId: '1', studentId: '20260011', name: '신예림', department: '소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-15' },
  { id: 'stu-12', cohortId: '1', studentId: '20260012', name: '조현우', department: 'AI융합학부', grade: 4, paymentStatus: 'unpaid', note: '휴학 예정' },
  { id: 'stu-13', cohortId: '1', studentId: '20260013', name: '류하은', department: 'AI소프트웨어학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-03-18' },
  { id: 'stu-14', cohortId: '1', studentId: '20260014', name: '백준영', department: '소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-20' },
  { id: 'stu-15', cohortId: '1', studentId: '20260015', name: '황민서', department: 'AI융합학부', grade: 3, paymentStatus: 'paid', paidAt: '2026-03-21' },
  { id: 'stu-16', cohortId: '1', studentId: '20260016', name: '고은지', department: 'AI소프트웨어학부', grade: 2, paymentStatus: 'unpaid' },
  { id: 'stu-17', cohortId: '1', studentId: '20260017', name: '문태준', department: '소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-22' },
  { id: 'stu-18', cohortId: '1', studentId: '20260018', name: '서지윤', department: 'AI융합학부', grade: 3, paymentStatus: 'paid', paidAt: '2026-03-25' },
  { id: 'stu-19', cohortId: '1', studentId: '20260019', name: '남건우', department: 'AI소프트웨어학부', grade: 2, paymentStatus: 'unpaid', note: '3월 말 납부 예정이라고 함' },
  { id: 'stu-20', cohortId: '1', studentId: '20260020', name: '배소연', department: '소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-03-26' },
  { id: 'stu-21', cohortId: '1', studentId: '20260021', name: '엄현준', department: 'AI융합학부', grade: 4, paymentStatus: 'paid', paidAt: '2026-03-28' },
  { id: 'stu-22', cohortId: '1', studentId: '20260022', name: '허나연', department: 'AI소프트웨어학부', grade: 1, paymentStatus: 'unpaid' },
  { id: 'stu-23', cohortId: '1', studentId: '20260023', name: '노재현', department: '소프트웨어학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-04-01' },
  { id: 'stu-24', cohortId: '1', studentId: '20260024', name: '안소윤', department: 'AI융합학부', grade: 3, paymentStatus: 'paid', paidAt: '2026-04-02' },
  { id: 'stu-25', cohortId: '1', studentId: '20260025', name: '전민재', department: 'AI소프트웨어학부', grade: 1, paymentStatus: 'unpaid' },
  { id: 'stu-26', cohortId: '1', studentId: '20260026', name: '곽서진', department: '소프트웨어학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-04-03' },
  { id: 'stu-27', cohortId: '1', studentId: '20260027', name: '유지훈', department: 'AI융합학부', grade: 3, paymentStatus: 'paid', paidAt: '2026-04-04' },
  { id: 'stu-28', cohortId: '1', studentId: '20260028', name: '민채린', department: 'AI소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-04-05' },
  { id: 'stu-29', cohortId: '1', studentId: '20260029', name: '구태호', department: '소프트웨어학부', grade: 4, paymentStatus: 'unpaid', note: '전화 미연결' },
  { id: 'stu-30', cohortId: '1', studentId: '20260030', name: '변예진', department: 'AI융합학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-04-06' },
  { id: 'stu-31', cohortId: '1', studentId: '20260031', name: '성민호', department: 'AI소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-04-07' },
  { id: 'stu-32', cohortId: '1', studentId: '20260032', name: '이채원', department: '소프트웨어학부', grade: 3, paymentStatus: 'unpaid' },
  { id: 'stu-33', cohortId: '1', studentId: '20260033', name: '장효준', department: 'AI융합학부', grade: 2, paymentStatus: 'paid', paidAt: '2026-04-07' },
  { id: 'stu-34', cohortId: '1', studentId: '20260034', name: '오수빈', department: 'AI소프트웨어학부', grade: 1, paymentStatus: 'paid', paidAt: '2026-04-08' },
  { id: 'stu-35', cohortId: '1', studentId: '20260035', name: '권태양', department: '소프트웨어학부', grade: 4, paymentStatus: 'unpaid' },
]

export { majors }
