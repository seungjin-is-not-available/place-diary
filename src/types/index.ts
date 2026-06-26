export interface Place {
  placeId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
  isCustom?: boolean;
}

export interface StayRecord {
  stayId: string;
  placeId: string;
  placeName: string;
  address: string;
  category: string;
  latitude?: number | null;
  longitude?: number | null;
  startTime: string;
  endTime?: string;
  duration?: number;
  date: string;
}

export interface DiaryEntry {
  diaryId: string;
  placeId: string;
  placeName: string;
  stayId?: string;
  content: string;
  mood?: string;
  createdAt: string;
  date: string;
}

export type Mood = '😊' | '🥰' | '😐' | '😔' | '😤' | '😴';
export const MOODS: Mood[] = ['😊', '🥰', '😐', '😔', '😤', '😴'];

export interface NaverSearchResult {
  placeId: string;
  name: string;
  address: string;
  roadAddress: string;
  category: string;
  latitude: number;
  longitude: number;
}
