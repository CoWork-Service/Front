import type { Survey } from '../types'

export const surveys: Survey[] = [
  {
    id: 'survey-1',
    cohortId: '1',
    title: '2026 학생회 신입생 만족도 조사',
    description: '이번 OT 및 신입생 환영 행사에 대한 여러분의 의견을 들려주세요.',
    status: 'open',
    createdBy: '박지훈',
    createdAt: '2026-04-01T10:00:00',
    updatedAt: '2026-04-02T09:00:00',
    questions: [
      {
        id: 'q-1-1', order: 1, title: '이름을 입력해주세요.', type: 'short_text', required: true,
      },
      {
        id: 'q-1-2', order: 2, title: '학번을 입력해주세요.', type: 'short_text', required: true,
      },
      {
        id: 'q-1-3', order: 3, title: 'OT 행사 전반적인 만족도는 어떠셨나요?', type: 'multiple_choice', required: true,
        options: [
          { id: 'o-1', text: '매우 만족' },
          { id: 'o-2', text: '만족' },
          { id: 'o-3', text: '보통' },
          { id: 'o-4', text: '불만족' },
          { id: 'o-5', text: '매우 불만족' },
        ],
      },
      {
        id: 'q-1-4', order: 4, title: '인상 깊었던 프로그램을 모두 선택해주세요.', type: 'checkbox', required: false,
        options: [
          { id: 'o-6', text: '자기소개 게임' },
          { id: 'o-7', text: '선후배 만남' },
          { id: 'o-8', text: '학생회 소개' },
          { id: 'o-9', text: '저녁 식사' },
          { id: 'o-10', text: '레크리에이션' },
        ],
      },
      {
        id: 'q-1-5', order: 5, title: '개선이 필요한 점이 있다면 자유롭게 작성해주세요.', type: 'long_text', required: false,
      },
    ],
    responses: [
      {
        id: 'res-1-1',
        respondedAt: '2026-04-03T14:00:00',
        answers: {
          'q-1-1': '홍길동',
          'q-1-2': '20261001',
          'q-1-3': '매우 만족',
          'q-1-4': ['자기소개 게임', '저녁 식사'],
          'q-1-5': '다음에도 이런 행사 부탁드려요!',
        },
      },
      {
        id: 'res-1-2',
        respondedAt: '2026-04-04T10:00:00',
        answers: {
          'q-1-1': '이하나',
          'q-1-2': '20261002',
          'q-1-3': '만족',
          'q-1-4': ['선후배 만남', '학생회 소개'],
          'q-1-5': '시간이 조금 촉박했어요.',
        },
      },
      {
        id: 'res-1-3',
        respondedAt: '2026-04-05T16:00:00',
        answers: {
          'q-1-1': '박철민',
          'q-1-2': '20261003',
          'q-1-3': '보통',
          'q-1-4': ['레크리에이션'],
          'q-1-5': '',
        },
      },
      {
        id: 'res-1-4',
        respondedAt: '2026-04-06T09:00:00',
        answers: {
          'q-1-1': '최수정',
          'q-1-2': '20261004',
          'q-1-3': '매우 만족',
          'q-1-4': ['자기소개 게임', '선후배 만남', '저녁 식사'],
          'q-1-5': '음식이 맛있었어요!',
        },
      },
      {
        id: 'res-1-5',
        respondedAt: '2026-04-07T11:00:00',
        answers: {
          'q-1-1': '정민혁',
          'q-1-2': '20261005',
          'q-1-3': '만족',
          'q-1-4': ['학생회 소개'],
          'q-1-5': '',
        },
      },
    ],
  },
  {
    id: 'survey-2',
    cohortId: '1',
    title: '과잠 수요조사',
    description: '2026 기수 과잠 단체 주문을 위한 수요조사입니다. 4월 10일까지 응답해주세요.',
    status: 'open',
    createdBy: '정다은',
    createdAt: '2026-04-05T09:00:00',
    updatedAt: '2026-04-05T09:00:00',
    questions: [
      { id: 'q-2-1', order: 1, title: '이름', type: 'short_text', required: true },
      { id: 'q-2-2', order: 2, title: '학번', type: 'short_text', required: true },
      {
        id: 'q-2-3', order: 3, title: '구매 의사가 있으신가요?', type: 'multiple_choice', required: true,
        options: [
          { id: 'o-21', text: '예, 구매할게요' },
          { id: 'o-22', text: '아니요, 이번엔 패스할게요' },
          { id: 'o-23', text: '아직 고민 중이에요' },
        ],
      },
      {
        id: 'q-2-4', order: 4, title: '사이즈를 선택해주세요.', type: 'dropdown', required: false,
        options: [
          { id: 'o-24', text: 'XS' },
          { id: 'o-25', text: 'S' },
          { id: 'o-26', text: 'M' },
          { id: 'o-27', text: 'L' },
          { id: 'o-28', text: 'XL' },
          { id: 'o-29', text: '2XL' },
        ],
      },
      {
        id: 'q-2-5', order: 5, title: '원하는 등판 문구를 적어주세요. (학번 또는 이름)', type: 'short_text', required: false,
      },
    ],
    responses: [
      {
        id: 'res-2-1',
        respondedAt: '2026-04-06T10:00:00',
        answers: { 'q-2-1': '김민준', 'q-2-2': '20260001', 'q-2-3': '예, 구매할게요', 'q-2-4': 'L', 'q-2-5': '20260001' },
      },
      {
        id: 'res-2-2',
        respondedAt: '2026-04-06T11:00:00',
        answers: { 'q-2-1': '이서연', 'q-2-2': '20260002', 'q-2-3': '예, 구매할게요', 'q-2-4': 'M', 'q-2-5': 'SEOYEON' },
      },
      {
        id: 'res-2-3',
        respondedAt: '2026-04-07T09:00:00',
        answers: { 'q-2-1': '박지훈', 'q-2-2': '20260003', 'q-2-3': '아직 고민 중이에요', 'q-2-4': '', 'q-2-5': '' },
      },
    ],
  },
  {
    id: 'survey-3',
    cohortId: '1',
    title: '4월 정기총회 안건 사전 조사',
    description: '4월 정기총회에서 논의할 안건을 미리 제안해주세요.',
    status: 'draft',
    createdBy: '박지훈',
    createdAt: '2026-04-07T16:00:00',
    updatedAt: '2026-04-07T16:00:00',
    questions: [
      { id: 'q-3-1', order: 1, title: '이름', type: 'short_text', required: true },
      { id: 'q-3-2', order: 2, title: '제안할 안건을 작성해주세요.', type: 'long_text', required: true },
      {
        id: 'q-3-3', order: 3, title: '안건의 중요도', type: 'multiple_choice', required: true,
        options: [
          { id: 'o-31', text: '매우 중요' },
          { id: 'o-32', text: '중요' },
          { id: 'o-33', text: '보통' },
        ],
      },
    ],
    responses: [],
  },
  {
    id: 'survey-4',
    cohortId: '2',
    title: '2025 기수 종강 파티 참가 신청',
    description: '종강 파티 참가 여부와 식사 선호도를 알려주세요.',
    status: 'closed',
    createdBy: '이전기획',
    createdAt: '2025-12-01T10:00:00',
    updatedAt: '2025-12-10T10:00:00',
    questions: [
      { id: 'q-4-1', order: 1, title: '이름', type: 'short_text', required: true },
      {
        id: 'q-4-2', order: 2, title: '참가 여부', type: 'multiple_choice', required: true,
        options: [
          { id: 'o-41', text: '참가' },
          { id: 'o-42', text: '불참' },
        ],
      },
      {
        id: 'q-4-3', order: 3, title: '선호하는 식사', type: 'checkbox', required: false,
        options: [
          { id: 'o-43', text: '한식' },
          { id: 'o-44', text: '양식' },
          { id: 'o-45', text: '중식' },
          { id: 'o-46', text: '분식' },
        ],
      },
    ],
    responses: Array.from({ length: 23 }, (_, i) => ({
      id: `res-4-${i + 1}`,
      respondedAt: `2025-12-${String(2 + i).padStart(2, '0')}T10:00:00`,
      answers: {
        'q-4-1': `학생${i + 1}`,
        'q-4-2': i % 5 === 0 ? '불참' : '참가',
        'q-4-3': i % 2 === 0 ? ['한식'] : ['양식', '분식'],
      },
    })),
  },
]
