import { useState, useEffect } from 'react';
import { getStays, saveStay, deleteDiary } from '../storage';
import type { StayRecord, Place } from '../types';
import PlaceSearch from './PlaceSearch';

interface Props { today: string; onNavigate: (tab: string) => void; }

export default function Home({ today, onNavigate }: Props) {
  const [stays, setStays] = useState<StayRecord[]>([]);
  const [activeStay, setActiveStay] = useState<StayRecord|null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const reload = () => {
    const data = getStays(today);
    setStays(data);
    setActiveStay(data.find(s => !s.endTime) || null);
  };

  useEffect(() => { reload(); }, [today]);

  useEffect(() => {
    if (!activeStay) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(activeStay.startTime).getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [activeStay]);

  const fmtElapsed = (s: number) => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; };
  const fmtDur = (m?: number) => !m?'':m<60?`${m}분`:`${Math.floor(m/60)}시간 ${m%60}분`;

  const handleSelectPlace = (place: Place) => {
    setShowSearch(false);
    const stay: StayRecord = { stayId: `stay_${Date.now()}`, placeId: place.placeId, placeName: place.name, address: place.address, category: place.category, startTime: new Date().toISOString(), date: today };
    saveStay(stay);
    setActiveStay(stay);
    setElapsed(0);
    setStays(prev => [...prev, stay]);
  };

  const handleEndStay = () => {
    if (!activeStay) return;
    const endTime = new Date().toISOString();
    const duration = Math.round((new Date(endTime).getTime() - new Date(activeStay.startTime).getTime()) / 60000);
    const updated = saveStay({ ...activeStay, endTime, duration });
    setActiveStay(null);
    setStays(prev => prev.map(s => s.stayId === updated.stayId ? updated : s));
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'long' });
  const totalMins = stays.filter(s=>s.duration).reduce((a,s)=>a+(s.duration||0),0);

  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-sm text-gray-500">{fmtDate(today)}</p>
        <h1 className="text-2xl font-bold mt-1">오늘의 장소 일기</h1>
      </div>

      {activeStay ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-green-600 font-medium mb-1">🟢 체류 중</p>
              <p className="font-bold text-lg">{activeStay.placeName}</p>
              <p className="text-sm text-gray-500">{activeStay.address}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-bold text-green-600">{fmtElapsed(elapsed)}</p>
              <p className="text-xs text-gray-400">경과 시간</p>
            </div>
          </div>
          <button onClick={handleEndStay} className="mt-3 w-full bg-green-500 text-white py-2.5 rounded-xl font-medium">체류 종료</button>
        </div>
      ) : (
        <button onClick={()=>setShowSearch(true)} className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-sm">
          <span className="text-xl">+</span> 장소 기록 시작
        </button>
      )}

      {stays.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">오늘 방문한 곳</h2>
            <button onClick={()=>onNavigate('daily')} className="text-sm text-green-600">전체 보기 →</button>
          </div>
          <div className="space-y-2">
            {stays.slice(-3).map(stay => (
              <div key={stay.stayId} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                <span className="text-xl">📌</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{stay.placeName}</p>
                  <p className="text-xs text-gray-400">{stay.address}</p>
                </div>
                {stay.duration ? <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">{fmtDur(stay.duration)}</span>
                  : <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">진행 중</span>}
              </div>
            ))}
          </div>
          {totalMins > 0 && <p className="text-sm text-gray-500 mt-2 text-center">총 {fmtDur(totalMins)} 기록됨</p>}
        </div>
      )}

      {showSearch && <PlaceSearch onSelect={handleSelectPlace} onClose={()=>setShowSearch(false)} />}
    </div>
  );
}
