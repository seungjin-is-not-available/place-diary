import { useState } from 'react';
import { saveDiary } from '../storage';
import { MOODS, type DiaryEntry, type Mood, type StayRecord } from '../types';

interface Props { stay: StayRecord; existing?: DiaryEntry; onSave: (e: DiaryEntry) => void; onClose: () => void; }

export default function DiaryEditor({ stay, existing, onSave, onClose }: Props) {
  const [content, setContent] = useState(existing?.content || '');
  const [mood, setMood] = useState<Mood|''>(existing?.mood as Mood || '');

  const fmt = (m?: number) => !m ? '' : m < 60 ? `${m}분` : `${Math.floor(m/60)}시간 ${m%60}분`;

  const handleSave = () => {
    if (!content.trim()) return;
    const entry: DiaryEntry = {
      diaryId: existing?.diaryId || `diary_${Date.now()}`,
      placeId: stay.placeId,
      placeName: stay.placeName,
      stayId: stay.stayId,
      content,
      mood: mood || undefined,
      createdAt: existing?.createdAt || new Date().toISOString(),
      date: stay.date,
    };
    onSave(saveDiary(entry));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">{stay.placeName}</h2>
            <p className="text-sm text-gray-500">{stay.address}{stay.duration ? ` · ${fmt(stay.duration)}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">오늘의 기분</p>
          <div className="flex gap-2">
            {MOODS.map(m => (
              <button key={m} onClick={()=>setMood(mood===m?'':m)} className={`text-2xl p-1.5 rounded-xl transition-all ${mood===m?'bg-green-100 ring-2 ring-green-400 scale-110':'hover:bg-gray-100'}`}>{m}</button>
            ))}
          </div>
        </div>
        <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400" rows={6} placeholder="이 장소에서의 기억을 기록해보세요..." value={content} onChange={e=>setContent(e.target.value)} autoFocus />
        <button onClick={handleSave} disabled={!content.trim()} className="w-full bg-green-500 text-white py-3 rounded-xl font-medium disabled:opacity-50">
          {existing ? '수정 저장' : '일기 저장'}
        </button>
      </div>
    </div>
  );
}
