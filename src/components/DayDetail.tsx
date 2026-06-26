import { useEffect, useRef, useState } from 'react';
import { getStays, getDiary, saveDiary, deleteDiary } from '../storage';
import type { StayRecord, DiaryEntry } from '../types';
import DiaryEditor from './DiaryEditor';

// Leaflet은 index.html CDN으로 로드 → 전역 L 사용
declare const L: any;

interface Props {
  date: string;
  onBack: () => void;
}

export default function DayDetail({ date, onBack }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [stays, setStays] = useState<StayRecord[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [editStay, setEditStay] = useState<StayRecord | null>(null);
  const [editDiary, setEditDiary] = useState<DiaryEntry | undefined>();

  const reload = () => {
    setStays(getStays(date));
    setDiaries(getDiary(date));
  };

  useEffect(() => { reload(); }, [date]);

  // Leaflet 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof L === 'undefined') return;

    // 기존 지도 제거
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const validStays = stays.filter(
      s => s.latitude && s.longitude && s.latitude > 33 && s.latitude < 43 && s.longitude > 124 && s.longitude < 132
    );

    if (!validStays.length) return;

    const map = L.map(mapRef.current);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // 마커 추가
    const markers: any[] = [];
    validStays.forEach((stay, i) => {
      const icon = L.divIcon({
        html: `<div style="background:#22c55e;color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)">
          <span style="transform:rotate(45deg);font-size:12px;font-weight:bold">${i + 1}</span>
        </div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32],
      });
      const marker = L.marker([stay.latitude!, stay.longitude!], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-size:13px"><b>${stay.placeName}</b><br><span style="color:#888;font-size:11px">${stay.address}</span></div>`);
      markers.push([stay.latitude!, stay.longitude!]);
    });

    // 이동 경로 폴리라인
    if (validStays.length > 1) {
      const latlngs = validStays.map(s => [s.latitude!, s.longitude!]);

      // 배경 선 (흰색)
      L.polyline(latlngs, { color: 'white', weight: 6, opacity: 0.8 }).addTo(map);
      // 메인 선 (초록 점선)
      L.polyline(latlngs, { color: '#22c55e', weight: 3, opacity: 0.9, dashArray: '8,5' }).addTo(map);

      // 화살표 방향 (중간마다)
      for (let i = 0; i < latlngs.length - 1; i++) {
        const [lat1, lon1] = latlngs[i];
        const [lat2, lon2] = latlngs[i + 1];
        const midLat = (lat1 + lat2) / 2;
        const midLon = (lon1 + lon2) / 2;
        const angle = Math.atan2(lat2 - lat1, lon2 - lon1) * 180 / Math.PI;
        L.marker([midLat, midLon], {
          icon: L.divIcon({
            html: `<div style="transform:rotate(${-angle}deg);color:#16a34a;font-size:16px;font-weight:bold">▶</div>`,
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
          interactive: false,
        }).addTo(map);
      }
    }

    // 지도 범위 맞추기
    if (markers.length === 1) {
      map.setView(markers[0], 16);
    } else {
      map.fitBounds(markers, { padding: [40, 40] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [stays]);

  const fmtDur = (m?: number) => !m ? '진행 중' : m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간 ${m % 60}분`;
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const getDiaryForStay = (id: string) => diaries.find(d => d.stayId === id);

  const validForMap = stays.filter(
    s => s.latitude && s.longitude && s.latitude > 33 && s.latitude < 43 && s.longitude > 124 && s.longitude < 132
  );

  const fmtDateLabel = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl">←</button>
        <h2 className="font-bold">{fmtDateLabel(date)}</h2>
        <div className="ml-auto text-sm text-gray-400">{stays.length}곳 방문</div>
      </div>

      {/* 지도 영역 */}
      {validForMap.length > 0 ? (
        <div className="relative">
          <div ref={mapRef} style={{ height: '280px', width: '100%' }} />
          {validForMap.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs text-gray-600 shadow-sm">
              📍 {validForMap.length}곳 이동 경로
            </div>
          )}
        </div>
      ) : (
        <div className="w-full bg-gray-100 flex flex-col items-center justify-center gap-1" style={{ height: '120px' }}>
          <p className="text-2xl">🗺️</p>
          <p className="text-gray-400 text-sm">위치 정보가 있는 장소가 없습니다</p>
        </div>
      )}

      {/* 타임라인 */}
      <div className="flex-1 p-5 pb-24">
        {stays.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">📭</p>
            <p>이 날의 기록이 없습니다.</p>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-sm text-gray-500 mb-3">방문 기록</h3>
            <div className="relative">
              {/* 타임라인 세로선 */}
              <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {stays.map((stay, idx) => {
                  const diary = getDiaryForStay(stay.stayId);
                  const hasCoord = stay.latitude && stay.longitude &&
                    stay.latitude > 33 && stay.latitude < 43 && stay.longitude > 124 && stay.longitude < 132;
                  return (
                    <div key={stay.stayId} className="relative pl-12">
                      {/* 번호 마커 */}
                      <div className={`absolute left-3 top-4 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white ${stay.endTime ? 'bg-green-400' : 'bg-green-500'}`}>
                        {idx + 1}
                      </div>
                      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{stay.placeName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{stay.address}</p>
                          </div>
                          {!hasCoord && (
                            <span className="text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-full">위치 미확인</span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                          <span>🕐 {fmtTime(stay.startTime)}</span>
                          {stay.endTime && <span>~ {fmtTime(stay.endTime)}</span>}
                          <span className="text-green-600 font-medium">{fmtDur(stay.duration)}</span>
                        </div>
                        {diary ? (
                          <div className="mt-3 bg-gray-50 rounded-xl p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                {diary.mood && <span className="text-lg mr-1">{diary.mood}</span>}
                                <span className="text-sm text-gray-700">{diary.content}</span>
                              </div>
                              <button
                                onClick={() => { setEditStay(stay); setEditDiary(diary); }}
                                className="text-xs text-blue-400 whitespace-nowrap"
                              >수정</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditStay(stay); setEditDiary(undefined); }}
                            className="mt-3 w-full text-sm text-green-600 border border-dashed border-green-200 rounded-xl py-2 hover:bg-green-50 transition-colors"
                          >
                            ✏️ 일기 쓰기
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {editStay && (
        <DiaryEditor
          stay={editStay}
          existing={editDiary}
          onSave={() => { reload(); setEditStay(null); setEditDiary(undefined); }}
          onClose={() => { setEditStay(null); setEditDiary(undefined); }}
        />
      )}
    </div>
  );
}
