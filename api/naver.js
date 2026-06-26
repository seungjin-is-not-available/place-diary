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
      latitude: parseFloat(item.mapy) / 1e7,
      longitude: parseFloat(item.mapx) / 1e7,
    }));

    res.json({ items, total: data.total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Naver API' });
  }
}
