import { useState, useEffect } from 'react';
import { searchNaver } from '../api';
import { savePlace } from '../storage';
import type { NaverSearchResult, Place } from '../types';

interface Props { onSelect: (place: Place) => void; onClose: () => void; }

// 두 좌표 사이 거리 계산 (Haversine 공식, 단위: m)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export default function PlaceSearch({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(NaverSearchResult & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ name: '', address: '', category: '' });
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [locating, setLocating] = useState(true);

  // 컴포넌트 열리면 즉시 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await searchNaver(query);

      let items = data.items;

      // 위치가 있으면 거리 계산 후 정렬
      if (userLat !== null && userLon !== null) {
        items = items
          .map((item) => ({
            ...item,
            distance:
              item.latitude && item.longitude
                ? getDistance(userLat, userLon, item.latitude, item.longitude)
                : undefined,
          }))
          .sort((a, b) => {
            if (a.distance == null) return 1;
            if (b.distance == null) return -1;
            return a.distance - b.distance;
          });
      }

      setResults(items);
      if (!items.length) setError('검색 결과가 없습니다.');
    } catch (e: any) {
      setError(e.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: NaverSearchResult) => {
    const place: Place = {
      placeId: item.placeId,
      name: item.name,
      address: item.roadAddress || item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      category: item.category,
    };
    onSelect(savePlace(place));
  };

  const handleManualSave = () => {
    if (!manual.name.trim()) return;
    const place: Place = {
      placeId: `custom_${Date.now()}`,
      name: manual.name,
      address: manual.address,
      latitude: userLat,
      longitude: userLon,
      category: manual.category,
      isCustom: true,
    };
    onSelect(savePlace(place));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold">장소 선택</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {locating
                ? '📍 위치 확인 중...'
                : userLat
                ? '📍 위치 확인됨 — 가까운 순으로 정렬됩니다'
                : '📍 위치 없음 — 네이버 기본 순서로 표시'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="카페, 음식점, 서점..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={loading || locating}
            className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? '검색 중' : '검색'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* Results */}
        <div className="overflow-y-auto flex-1 space-y-2">
          {results.map((item) => (
            <button
              key={item.placeId}
              onClick={() => handleSelect(item)}
              className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate">{item.roadAddress || item.address}</p>
                  {item.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {item.category}
                    </span>
                  )}
                </div>
                {item.distance != null && (
                  <span className="text-xs text-green-600 font-medium whitespace-nowrap mt-0.5">
                    {fmtDistance(item.distance)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Manual registration */}
        <div className="mt-3 border-t pt-3">
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ➕ 검색에 없는 장소 직접 등록
          </button>
          {showManual && (
            <div className="mt-2 space-y-2">
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="장소 이름 *" value={manual.name} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="주소 (선택)" value={manual.address} onChange={(e) => setManual((m) => ({ ...m, address: e.target.value }))} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="카테고리 (선택)" value={manual.category} onChange={(e) => setManual((m) => ({ ...m, category: e.target.value }))} />
              <button onClick={handleManualSave} className="w-full bg-green-500 text-white py-2 rounded-xl text-sm font-medium">저장</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
