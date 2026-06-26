// 네이버 좌표 파싱 (mapy/mapx → 위도/경도)
// 네이버는 정수형 문자열로 반환 e.g. "375667990" → 37.5667990
function parseNaverCoord(val) {
  if (!val) return 0;
  const n = parseFloat(val);
  if (isNaN(n) || n === 0) return 0;
  // 이미 소수점이 있으면 그대로 반환
  if (String(val).includes('.')) return n;
  // 자릿수로 스케일 결정: 위도(37.x)는 9자리, 경도(127.x)는 10자리
  const digits = String(Math.abs(Math.round(n))).length;
  if (digits >= 9) return n / 1e7;
  if (digits >= 8) return n / 1e6;
  return n / 1e5;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, display = 10 } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Naver API keys not configured' });
  }

  try {
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${display}`;
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    const items = (data.items || []).map((item, idx) => ({
      placeId: `naver_${idx}_${Date.now()}`,
      name: item.title.replace(/<[^>]+>/g, ''),
      address: item.address || item.roadAddress || '',
      roadAddress: item.roadAddress || '',
      category: item.category || '',
      latitude: parseNaverCoord(item.mapy),
      longitude: parseNaverCoord(item.mapx),
    }));

    res.json({ items, total: data.total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Naver API' });
  }
}
