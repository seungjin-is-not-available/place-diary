import type { NaverSearchResult } from './types';

export async function searchNaver(query: string): Promise<{ items: NaverSearchResult[] }> {
  const res = await fetch(`/api/naver?query=${encodeURIComponent(query)}&display=10`);
  if (!res.ok) throw new Error('검색 실패');
  return res.json();
}
