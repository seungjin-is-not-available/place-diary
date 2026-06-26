import { useState, useEffect, useRef } from 'react';
import { searchNaver } from '../api';
import { savePlace } from '../storage';
import type { NaverSearchResult, Place } from '../types';

interface Props { onSelect: (place: Place) => void; onClose: () => void; }

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`;
}

function validCoord(lat: number, lon: number) {
  return lat > 33 && lat < 43 && lon > 124 && lon < 132;
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
  const [locationLabel, setLocationLabel] = useState<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`
      );
      const data = await res.json();
      const a = data.address || {};
      const label = a.quarter || a.neighbourhood || a.suburb || a.village ||
                    a.town || a.city_district || a.county || a.city || a.state || '';
      setLocationLabel(label);
    } catch {
      setLocationLabel('');
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setLocating(false); return; }
    setLocating(true);
    setLocationLabel('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
        setLocating(false);
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) { setResults([]); setError(''); return; }
    debounceRef.current = setTimeout(() => doSearch(query), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userLat, userLon]);

  const doSearch = async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await searchNaver(q);
      let items = data.items.map((item) => {
        const hasCoords = item.latitude && item.longitude && validCoord(item.latitude, item.longitude);
        const distance = (hasCoords && userLat !== null && userLon !== null)
          ? getDistance(userLat, userLon, item.latitude, item.longitude)
          : undefined;
        return { ...item, distance };
      });
      if (userLat !== null && userLon !== null) {
        items = items.sort((a, b) => {
          if (a.distance == null && b.distance == null) return 0;
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });
      }
      setResults(items);
      if (!items.length) setError('검색 결과가 없습니다.');
    } catch (e: any) {
      setError(e.message || '검색 오류');
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
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-lg font-bold">장소 선택</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {locating ? (
                <p className="text-xs text-gray-400">📍 위치 확인 중...</p>
              ) : userLat ? (
                <p className="text-xs text-green-600 font-medium">
                  📍 {locationLabel ? locationLabel : '위치 확인됨'} · 가까운 순
                </p>
              ) : (
                <p className="text-xs text-gray-400">📍 위치 미확인</p>
              )}
              {!locating && (
                <button onClick={getLocation} className="text-xs text-green-500 underline">
                  {userLat ? '새로고침' : '위치 재시도'}
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
        </div>

        <div className="relative mb-3">
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pr-10"
            placeholder="카페, 음식점, 서점 이름 입력..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">✕</button>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <div className="overflow-y-auto flex-1 space-y-2">
          {!query && !results.length && (
            <p className="text-center text-gray-400 text-sm py-8">검색어를 입력하면 자동으로 장소가 표시됩니다</p>
          )}
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
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">{item.category}</span>
                  )}
                </div>
                {item.distance != null && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                    {fmtDist(item.distance)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 border-t pt-3">
          <button onClick={() => setShowManual(!showManual)} className="text-sm text-gray-500 hover:text-gray-700">
            ➕ 검색에 없는 장소 직접 등록
          </button>
          {showManual && (
            <div className="mt-2 space-y-2">
 
