import { useState, useEffect } from 'react';
import { getArchiveStats } from '../storage';

export default function Archive() {
  const [stats, setStats] = useState<ReturnType<typeof getArchiveStats>>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { setStats(getArchiveStats()); }, []);

  const fmtDur = (m: number) => { if(!m) return '-'; const h=Math.floor(m/60); return h>0?`${h}시간 ${m%60}분`:`${m}분`; };
  const filtered = stats.filter(s => s.name.includes(filter)||s.address.includes(filter)||s.category.includes(filter));
  const totalVisits = stats.reduce((a,s)=>a+s.visitCount,0);
  const totalMins = stats.reduce((a,s)=>a+(s.totalMinutes||0),0);

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">장소 아카이브</h2>
      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-600">{stats.length}</p><p className="text-xs text-gray-500">방문 장소</p></div>
          <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-600">{totalVisits}</p><p className="text-xs text-gray-500">총 방문 횟수</p></div>
          <div className="bg-purple-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-purple-600">{Math.floor(totalMins/60)}</p><p className="text-xs text-gray-500">총 체류(h)</p></div>
        </div>
      )}
      <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="장소 이름, 주소로 검색..." value={filter} onChange={e=>setFilter(e.target.value)} />
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16"><p className="text-4xl mb-3">🗂️</p><p>{filter?'검색 결과 없음':'아직 방문한 장소가 없습니다.'}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(stat => (
            <div key={stat.placeId} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{stat.name}</p>
                  <p className="text-xs text-gray-400 truncate">{stat.address}</p>
                  {stat.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">{stat.category}</span>}
                </div>
                <div className="text-right ml-3">
                  <p className="text-green-600 font-bold">{stat.visitCount}회</p>
                  <p className="text-xs text-gray-400">{fmtDur(stat.totalMinutes)}</p>
                </div>
              </div>
              {stat.lastVisit && <p className="text-xs text-gray-400 mt-2">마지막 방문: {new Date(stat.lastVisit).toLocaleDateString('ko-KR')}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
