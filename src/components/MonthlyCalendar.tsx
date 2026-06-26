import { useState, useEffect } from 'react';
import { getStays, getDiary } from '../storage';
import type { StayRecord } from '../types';

interface Props {
  onViewDetail: (date: string) => void;
}

export default function MonthlyCalendar({ onViewDetail }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayStays, setDayStays] = useState<StayRecord[]>([]);
  const [visitDays, setVisitDays] = useState<Record<string, number>>({});
  const [lastTap, setLastTap] = useState<{ date: string; time: number } | null>(null);

  // 해당 월의 방문 일자 계산
  useEffect(() => {
    const ym = `${year}-${String(month + 1).padStart(2, '0')}`;
    const allStays = getStays();
    const days: Record<string, number> = {};
    allStays.filter(s => s.date.startsWith(ym)).forEach(s => {
      days[s.date] = (days[s.date] || 0) + 1;
    });
    setVisitDays(days);
    setSelectedDate(null);
  }, [year, month]);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fmtDate = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => {
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1);
  };

  const handleDayClick = (dateStr: string) => {
    const now = Date.now();
    // 더블클릭 감지 (400ms 이내 같은 날 두 번)
    if (lastTap && lastTap.date === dateStr && now - lastTap.time < 400) {
      onViewDetail(dateStr);
      return;
    }
    setLastTap({ date: dateStr, time: now });
    setSelectedDate(dateStr);
    setDayStays(getStays(dateStr));
  };

  const fmtDur = (m?: number) => !m ? '' : m < 60 ? `${m}분` : `${Math.floor(m/60)}시간 ${m%60}분`;

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const diaryDays = (() => {
    const ym = `${year}-${String(month + 1).padStart(2, '0')}`;
    const all = getDiary();
    const days = new Set<string>();
    all.filter(d => d.date.startsWith(ym)).forEach(d => days.add(d.date));
    return days;
  })();

  return (
    <div className="p-5">
      {/* 월 이동 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-xl text-gray-500">‹</button>
        <h2 className="font-bold text-lg">{year}년 {month + 1}월</h2>
        <button
          onClick={nextMonth}
          disabled={year === today.getFullYear() && month === today.getMonth()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-xl text-gray-500 disabled:opacity-30"
        >›</button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
        {['일','월','화','수','목','금','토'].map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = fmtDate(day);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const visitCount = visitDays[dateStr] || 0;
          const hasDiary = diaryDays.has(dateStr);
          const dow = (firstDow + day - 1) % 7;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              className={`relative flex flex-col items-center py-2 rounded-xl transition-colors select-none
                ${isSelected ? 'bg-green-50 ring-2 ring-green-400' : 'hover:bg-gray-50 active:bg-gray-100'}`}
            >
              <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? 'bg-green-500 text-white font-bold'
                  : dow === 0 ? 'text-red-400'
                  : dow === 6 ? 'text-blue-400'
                  : 'text-gray-700'}`}>
                {day}
              </span>
              {/* 방문 점 */}
              {visitCount > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(visitCount, 3) }).map((_, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  ))}
                </div>
              )}
              {/* 일기 점 */}
              {hasDiary && visitCount === 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-400" /> 방문
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-yellow-400" /> 일기
        </div>
      </div>

      {/* 날짜 클릭 시 개요 */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-sm">
              {new Date(selectedDate).toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'short' })}
            </p>
            <button
              onClick={() => onViewDetail(selectedDate)}
              className="text-xs text-white bg-green-500 px-3 py-1.5 rounded-full"
            >
              지도로 보기 →
            </button>
          </div>

          {dayStays.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">방문 기록 없음</p>
          ) : (
            <div className="space-y-2">
              {dayStays.map((s, i) => (
                <div key={s.stayId} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.placeName}</p>
                    {s.duration && <p className="text-xs text-gray-400">{fmtDur(s.duration)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-300 text-center mt-3">더블클릭으로 이동 경로 지도 보기</p>
        </div>
      )}
    </div>
  );
}
