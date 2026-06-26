import type { Place, StayRecord, DiaryEntry } from './types';

// ── Generic helpers ──────────────────────────────────────────
function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Places ───────────────────────────────────────────────────
export function getPlaces(): Place[] { return load<Place>('pd_places'); }

export function savePlace(place: Place): Place {
  const all = getPlaces();
  const idx = all.findIndex(p => p.placeId === place.placeId);
  if (idx >= 0) all[idx] = place; else all.push(place);
  save('pd_places', all);
  return place;
}

// ── Stay Records ─────────────────────────────────────────────
export function getStays(date?: string): StayRecord[] {
  const all = load<StayRecord>('pd_stays');
  return date ? all.filter(s => s.date === date) : all;
}

export function saveStay(stay: StayRecord): StayRecord {
  const all = load<StayRecord>('pd_stays');
  const idx = all.findIndex(s => s.stayId === stay.stayId);
  if (idx >= 0) all[idx] = stay; else all.push(stay);
  save('pd_stays', all);
  return stay;
}

export function deleteStay(stayId: string) {
  save('pd_stays', load<StayRecord>('pd_stays').filter(s => s.stayId !== stayId));
}

// ── Diary Entries ─────────────────────────────────────────────
export function getDiary(date?: string): DiaryEntry[] {
  const all = load<DiaryEntry>('pd_diary');
  return date ? all.filter(d => d.date === date) : all;
}

export function saveDiary(entry: DiaryEntry): DiaryEntry {
  const all = load<DiaryEntry>('pd_diary');
  const idx = all.findIndex(d => d.diaryId === entry.diaryId);
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  save('pd_diary', all);
  return entry;
}

export function deleteDiary(diaryId: string) {
  save('pd_diary', load<DiaryEntry>('pd_diary').filter(d => d.diaryId !== diaryId));
}

// ── Archive stats ─────────────────────────────────────────────
export function getArchiveStats() {
  const places = getPlaces();
  const stays = load<StayRecord>('pd_stays');

  return places.map(p => {
    const ps = stays.filter(s => s.placeId === p.placeId);
    return {
      ...p,
      visitCount: ps.length,
      totalMinutes: ps.reduce((a, s) => a + (s.duration || 0), 0),
      lastVisit: ps.length ? ps[ps.length - 1].date : '',
    };
  }).filter(p => p.visitCount > 0)
    .sort((a, b) => b.visitCount - a.visitCount);
}
