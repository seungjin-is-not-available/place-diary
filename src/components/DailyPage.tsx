import { useState, useEffect } from 'react';
import { getStays, getDiary, deleteStay, deleteDiary } from '../storage';
import type { StayRecord, DiaryEntry } from '../types';
import DiaryEditor from './DiaryEditor';

interface Props { today: string; }

export default function DailyPage({ today }: Props) {
  const [date, setDate] = useState(today);
  const [stays, setStays] = useState<StayRecord[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [editStay, setEditStay] = useState<StayRecord|null>(null);
  const [editDiary, setEditDiary] = useState<DiaryEntry|undefined>();

  const reload = (d: string) => { setStays(getStays(d)); setDiaries(getDiary(d)); };
  useEffect(() => { reload(date); }, [date]);

  const fmtDur = (m?: number) => !m?'진행 중':m<60?`${m}분`:`${Math.floor(m/60)}시간 ${m%60}분`;
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  const getDiaryForStay = (id: string) => diaries.find(d=>d.stayId===id);

  const prevDay = () => { const d=new Date(date); d.setDate(d.getDate()-1); setDate(d.toISOString().split('T')[0]); };
  const nextDay = () => { const d=new Date(date); d.setDate(d.getDate()+1); if(d<=new Date()) setDate(d.toISOString().split('T')[0]); };

  const handleDeleteStay = (id: string) => { if(!confirm('삭제하시겠습니까?')) return; deleteStay(id); reload(date); };
  const handleDeleteDiary = (id: string) => { if(!confirm('일기를 삭제하시겠습니까?')) return; deleteDiary(id); reload(date); };
  const handleDiarySaved = () => { reload(date); setEditStay(null); setEditDiary(undefined); };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevDay} className="text-xl px-2">‹</button>
        <h2 className="font-bold text-base">{new Date(date).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}</h2>
        <button onClick={nextDay} disabled={date>=today} className="text-xl px-2 disabled:opacity-30">›</button>
      </div>

      {stays.length === 0 ? (
        <div className="text-center text-gray-400 py-16"><p className="text-4xl mb-3">📭</p><p>이 날의 기록이 없습니다.</p></div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />
          <div className="space-y-4">
            {stays.map(stay => {
              const diary = getDiaryForStay(stay.stayId);
              return (
                <div key={stay.stayId} className="relative pl-12">
                  <div className={`absolute left-3.5 top-3.5 w-3 h-3 rounded-full ring-2 ring-white ${stay.endTime?'bg-green-400':'bg-green-500 animate-pulse'}`} />
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{stay.placeName}</p>
                        <p className="text-xs text-gray-400">{stay.address}</p>
                      </div>
                      <button onClick={()=>handleDeleteStay(stay.stayId)} className="text-gray-300 hover:text-red-400 text-lg ml-2">✕</button>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span>🕐 {fmtTime(stay.startTime)}</span>
                      {stay.endTime && <span>→ {fmtTime(stay.endTime)}</span>}
                      <span className="text-green-600 font-medium">{fmtDur(stay.duration)}</span>
                    </div>
                    {diary ? (
                      <div className="mt-3 bg-gray-50 rounded-xl p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {diary.mood && <span className="text-lg mr-1">{diary.mood}</span>}
                            <p className="text-sm text-gray-700 inline">{diary.content}</p>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <button onClick={()=>{setEditStay(stay);setEditDiary(diary);}} className="text-xs text-blue-400 hover:text-blue-600">수정</button>
                            <button onClick={()=>handleDeleteDiary(diary.diaryId)} className="text-xs text-red-300 hover:text-red-500">삭제</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={()=>{setEditStay(stay);setEditDiary(undefined);}} className="mt-3 w-full text-sm text-green-600 border border-dashed border-green-300 rounded-xl py-2 hover:bg-green-50">✏️ 일기 쓰기</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {editStay && <DiaryEditor stay={editStay} existing={editDiary} onSave={handleDiarySaved} onClose={()=>{setEditStay(null);setEditDiary(undefined);}} />}
    </div>
  );
}
