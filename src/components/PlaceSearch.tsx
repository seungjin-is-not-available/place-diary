import { useState } from 'react';
import { searchNaver } from '../api';
import { savePlace } from '../storage';
import { useGeolocation } from '../hooks/useGeolocation';
import type { NaverSearchResult, Place } from '../types';

interface Props { onSelect: (place: Place) => void; onClose: () => void; }

export default function PlaceSearch({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NaverSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ name: '', address: '', category: '' });
  const { latitude, longitude, locate, loading: geoLoading } = useGeolocation();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await searchNaver(query);
      setResults(data.items);
      if (!data.items.length) setError('검색 결과가 없습니다.');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSelect = (item: NaverSearchResult) => {
    const place: Place = { placeId: item.placeId, name: item.name, address: item.roadAddress || item.address, latitude: item.latitude, longitude: item.longitude, category: item.category };
    onSelect(savePlace(place));
  };

  const handleManualSave = () => {
    if (!manual.name.trim()) return;
    const place: Place = { placeId: `custom_${Date.now()}`, name: manual.name, address: manual.address, latitude, longitude, category: manual.category, isCustom: true };
    onSelect(savePlace(place));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-5 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">장소 선택</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>
        <div className="flex gap-2 mb-3">
          <input className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="카페, 음식점, 서점..." value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} />
          <button onClick={handleSearch} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">{loading?'검색 중':'검색'}</button>
        </div>
        <button onClick={locate} disabled={geoLoading} className="text-sm text-blue-500 mb-3 text-left">
          {geoLoading?'📍 위치 가져오는 중...': latitude?'📍 위치 확인됨':'📍 내 위치 가져오기'}
        </button>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="overflow-y-auto flex-1 space-y-2">
          {results.map(item => (
            <button key={item.placeId} onClick={()=>handleSelect(item)} className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-colors">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">{item.roadAddress||item.address}</p>
              {item.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">{item.category}</span>}
            </button>
          ))}
        </div>
        <div className="mt-3 border-t pt-3">
          <button onClick={()=>setShowManual(!showManual)} className="text-sm text-gray-500 hover:text-gray-700">➕ 직접 장소 등록</button>
          {showManual && (
            <div className="mt-2 space-y-2">
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="장소 이름 *" value={manual.name} onChange={e=>setManual(m=>({...m,name:e.target.value}))} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="주소 (선택)" value={manual.address} onChange={e=>setManual(m=>({...m,address:e.target.value}))} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="카테고리 (선택)" value={manual.category} onChange={e=>setManual(m=>({...m,category:e.target.value}))} />
              <button onClick={handleManualSave} className="w-full bg-green-500 text-white py-2 rounded-xl text-sm font-medium">저장</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
