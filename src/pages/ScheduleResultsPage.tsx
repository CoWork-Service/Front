import React, { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Trophy } from 'lucide-react'
import { useScheduleStore } from '../store/useScheduleStore'
import { TimetableStatusBadge } from '../components/common/StatusBadge'

function generateDates(start: string, end: string): string[] {
  const dates: string[] = []
  const d = new Date(start)
  const e = new Date(end)
  while (d <= e) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function generateTimes(start: string, end: string, slotMinutes: number): string[] {
  const times: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = sh * 60 + sm
  const endMins = eh * 60 + em
  while (mins < endMins) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    mins += slotMinutes
  }
  return times
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function TimetableResultsPage() {
  const { pollId } = useParams<{ pollId: string }>()
  const { schedules } = useScheduleStore()
  const tt = schedules.find((t) => t.id === pollId)

  if (!tt) return <div className="p-8 text-slate-500">조율을 찾을 수 없습니다.</div>

  const dates = generateDates(tt.dateRange.start, tt.dateRange.end)
  const times = generateTimes(tt.timeRange.start, tt.timeRange.end, tt.slotMinutes)
  const totalResponses = tt.responses.length

  // 슬롯별 응답 수 계산
  const slotCounts = useMemo(() => {
    const map: Record<string, number> = {}
    tt.responses.forEach((r) => {
      r.availableSlots.forEach((slot) => {
        const key = `${slot.date}_${slot.time}`
        map[key] = (map[key] ?? 0) + 1
      })
    })
    return map
  }, [tt.responses])

  const maxCount = Math.max(...Object.values(slotCounts), 1)

  // 가장 많이 겹치는 시간대
  const topSlots = useMemo(() => {
    return Object.entries(slotCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, count]) => {
        const [date, time] = key.split('_')
        return { date, time, count }
      })
  }, [slotCounts])

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 border-slate-200'
    const intensity = count / maxCount
    if (intensity > 0.75) return 'bg-blue-700 border-blue-600'
    if (intensity > 0.5) return 'bg-blue-500 border-blue-400'
    if (intensity > 0.25) return 'bg-blue-300 border-blue-200'
    return 'bg-blue-100 border-blue-200'
  }

  const respondedNames = tt.responses.map((r) => r.participantName)
  const notResponded = tt.participants.filter((p) => !respondedNames.includes(p))

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/schedules" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5">
        <ArrowLeft size={15} />일정 관리
      </Link>

      {/* 요약 */}
      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl font-bold text-slate-900">{tt.title}</h1>
          <TimetableStatusBadge status={tt.status} />
        </div>
        <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">응답</p>
            <p className="text-2xl font-bold text-slate-900">{totalResponses}<span className="text-sm text-slate-400 ml-1">/ {tt.participants.length}명</span></p>
          </div>
          {topSlots.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Trophy size={11} />가장 많이 겹치는 시간</p>
              <div className="flex flex-wrap gap-1.5">
                {topSlots.map((s, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg font-medium">
                    {s.date} {s.time} ({s.count}명)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {totalResponses === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <Users size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm">아직 응답이 없습니다.</p>
          <Link to={`/schedules/${pollId}/respond`} className="btn-primary mt-4 inline-flex">응답하러 가기</Link>
        </div>
      ) : (
        <>
          {/* 히트맵 그리드 */}
          <div className="card overflow-hidden mb-5">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">응답 히트맵</h2>
              <p className="text-xs text-slate-400 mt-0.5">진한 색일수록 더 많은 인원이 가능</p>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full select-none">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="w-16 text-xs font-medium text-slate-500 px-2 py-2 text-right">시간</th>
                    {dates.map((d) => {
                      const day = new Date(d).getDay()
                      return (
                        <th key={d} className="text-center text-xs px-1 py-2 min-w-[52px]">
                          <div className={`font-semibold ${day === 0 ? 'text-red-500' : day === 6 ? 'text-blue-500' : 'text-slate-700'}`}>
                            {d.slice(5)}
                          </div>
                          <div className="text-slate-400">{DAY_NAMES[day]}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {times.map((time) => (
                    <tr key={time}>
                      <td className="text-right text-xs text-slate-400 px-2 py-0.5 w-16">{time}</td>
                      {dates.map((date) => {
                        const key = `${date}_${time}`
                        const count = slotCounts[key] ?? 0
                        const colorClass = getHeatmapColor(count)
                        return (
                          <td key={date} className="px-1 py-0.5">
                            <div
                              className={`h-8 rounded border cursor-default transition-colors group relative ${colorClass}`}
                              title={count > 0 ? `${count}명 가능` : '가능한 인원 없음'}
                            >
                              {count > 0 && (
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  {count}
                                </span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 범례 */}
            <div className="flex items-center gap-2 px-4 pb-3 text-xs text-slate-500">
              <span>적음</span>
              {['bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-700'].map((c) => (
                <div key={c} className={`w-5 h-3 rounded ${c}`} />
              ))}
              <span>많음</span>
            </div>
          </div>

          {/* 참여자 현황 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                응답 완료 ({respondedNames.length}명)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {respondedNames.map((name) => (
                  <span key={name} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{name}</span>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                미응답 ({notResponded.length}명)
              </h3>
              {notResponded.length === 0 ? (
                <p className="text-xs text-slate-400">모두 응답했습니다 🎉</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {notResponded.map((name) => (
                    <span key={name} className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
