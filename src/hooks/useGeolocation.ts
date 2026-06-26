import { useState, useCallback } from 'react';

export function useGeolocation() {
  const [state, setState] = useState({ latitude: null as number|null, longitude: null as number|null, error: null as string|null, loading: false });

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setState(s=>({...s,error:'위치 미지원'})); return; }
    setState(s=>({...s,loading:true,error:null}));
    navigator.geolocation.getCurrentPosition(
      pos => setState({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, error: null, loading: false }),
      err => {
        const msgs: Record<number,string> = { 1:'위치 권한이 거부되었습니다.', 2:'GPS 신호 없음.', 3:'시간 초과.' };
        setState({ latitude:null, longitude:null, error: msgs[err.code]||'위치 오류', loading:false });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, locate };
}
