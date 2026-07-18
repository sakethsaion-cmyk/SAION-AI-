import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT'] }));
app.use(express.json({ limit: '2mb' }));
app.use((req, _res, next) => { req.requestId = req.headers['x-request-id'] || crypto.randomUUID(); next(); });

// Simple cache
const _cache = new Map();
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10) * 1000;
function cacheGet(k) { const e = _cache.get(k); if (!e) return undefined; if (Date.now() > e.expiresAt) { _cache.delete(k); return undefined; } return e.value; }
function cacheSet(k, v) { _cache.set(k, { value: v, expiresAt: Date.now() + CACHE_TTL_MS }); }

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'SAION AI Backend' }));

// ── DUCKDUCKGO SEARCH PROXY ───────────────────────────────────────────────────
app.get('/api/v1/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ success: false, error: { message: 'Query required' } });
  const cached = cacheGet(`ddg:${q}`);
  if (cached) return res.json({ success: true, data: cached, cached: true });
  try {
    const ddgRes = await axios.get('https://api.duckduckgo.com/', {
      params: { q, format: 'json', no_html: 1, skip_disambig: 1 },
      timeout: 10000,
      headers: { 'User-Agent': 'SAION-AI/1.0' },
    });
    const data = ddgRes.data;
    const results = [];
    if (data.Abstract && data.AbstractURL) results.push({ title: data.Heading || q, url: data.AbstractURL, snippet: data.Abstract, source: data.AbstractSource || new URL(data.AbstractURL).hostname });
    if (data.Answer) results.push({ title: 'Quick Answer', url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}`, snippet: String(data.Answer), source: 'DuckDuckGo' });
    for (const t of (data.RelatedTopics || []).slice(0, 8)) {
      if (t.Text && t.FirstURL) { try { results.push({ title: t.Text.slice(0, 100), url: t.FirstURL, snippet: t.Text, source: new URL(t.FirstURL).hostname }); } catch {} }
    }
    const payload = { results: results.slice(0, 10), query: q, engine: 'duckduckgo' };
    cacheSet(`ddg:${q}`, payload);
    return res.json({ success: true, data: payload, cached: false });
  } catch (err) {
    return res.status(502).json({ success: false, error: { message: 'Search unavailable' } });
  }
});

// ── YOUTUBE API PROXY ─────────────────────────────────────────────────────────
const YT_BASE = 'https://www.googleapis.com/youtube/v3';
function formatDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0'), sec = parseInt(m[3] || '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${String(min).padStart(2, '0')}:${ss}` : `${min}:${ss}`;
}

app.get('/api/v1/youtube/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ success: false, error: { message: 'Query required' } });
  const cached = cacheGet(`yt:${q}`);
  if (cached) return res.json({ success: true, data: { ...cached }, cached: true });
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(503).json({ success: false, error: { message: 'YouTube API key not configured', code: 'NO_API_KEY' } });
  try {
    const searchRes = await axios.get(`${YT_BASE}/search`, { params: { key: apiKey, part: 'snippet', q, type: 'video', maxResults: 5, safeSearch: 'moderate' }, timeout: 10000 });
    const items = searchRes.data.items || [];
    const videoIds = items.map(i => i.id.videoId).filter(Boolean);
    if (!videoIds.length) return res.json({ success: true, data: { results: [], totalResults: 0 } });
    const detailsRes = await axios.get(`${YT_BASE}/videos`, { params: { key: apiKey, part: 'snippet,contentDetails', id: videoIds.join(',') }, timeout: 10000 });
    const detailsMap = new Map(detailsRes.data.items.map(i => [i.id, i]));
    const results = items.filter(i => detailsMap.has(i.id.videoId)).map(i => {
      const d = detailsMap.get(i.id.videoId);
      const th = i.snippet.thumbnails;
      return { videoId: i.id.videoId, title: i.snippet.title, channelTitle: i.snippet.channelTitle, description: i.snippet.description, thumbnail: th.high?.url || th.medium?.url || '', publishDate: i.snippet.publishedAt, duration: formatDuration(d.contentDetails.duration), videoUrl: `https://www.youtube.com/watch?v=${i.id.videoId}` };
    });
    const payload = { results, totalResults: searchRes.data.pageInfo?.totalResults || results.length };
    cacheSet(`yt:${q}`, payload);
    return res.json({ success: true, data: payload });
  } catch (err) {
    console.error('[YouTube]', err?.response?.data?.error?.message || err.message);
    return res.status(502).json({ success: false, error: { message: err?.response?.data?.error?.message || 'YouTube search failed' } });
  }
});

app.get('/api/v1/youtube/video/:id', async (req, res) => {
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return res.status(400).json({ success: false, error: { message: 'Invalid video ID' } });
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(503).json({ success: false, error: { message: 'YouTube API not configured' } });
  try {
    const r = await axios.get(`${YT_BASE}/videos`, { params: { key: apiKey, part: 'snippet,contentDetails', id }, timeout: 10000 });
    const item = r.data.items?.[0];
    if (!item) return res.status(404).json({ success: false, error: { message: 'Video not found' } });
    const th = item.snippet.thumbnails;
    return res.json({ success: true, data: { video: { videoId: item.id, title: item.snippet.title, channelTitle: item.snippet.channelTitle, thumbnail: th.high?.url || th.medium?.url || '', duration: formatDuration(item.contentDetails.duration), videoUrl: `https://www.youtube.com/watch?v=${item.id}` } } });
  } catch (err) {
    return res.status(502).json({ success: false, error: { message: 'Video lookup failed' } });
  }
});

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', youtube: !!process.env.YOUTUBE_API_KEY, search: 'duckduckgo' }));

// ── NETLIFY DEPLOY ────────────────────────────────────────────────────────────
app.post('/deploy-website', async (req, res) => {
  const { html, siteName } = req.body;
  const token = process.env.NETLIFY_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'Netlify token not configured' });
  if (!html) return res.status(400).json({ error: 'Missing html' });
  try {
    const slug = (siteName || 'saion-site').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40) + '-' + Date.now().toString(36);
    const createRes = await axios.post('https://api.netlify.com/api/v1/sites', { name: slug }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 15000 });
    const siteId = createRes.data.id;
    const siteUrl = createRes.data.ssl_url || createRes.data.url;
    const sha1 = crypto.createHash('sha1').update(html).digest('hex');
    const deployRes = await axios.post(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, { files: { '/index.html': sha1 }, draft: false }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 15000 });
    const deployId = deployRes.data.id;
    await axios.put(`https://api.netlify.com/api/v1/deploys/${deployId}/files/index.html`, html, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' }, timeout: 15000 });
    const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + 2);
    return res.json({ url: siteUrl, siteId, deployId, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err?.response?.data?.message || err.message || 'Deploy failed' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 SAION AI Backend on http://localhost:${PORT}`);
  console.log(`   Search:  /api/v1/search (DuckDuckGo, free)`);
  console.log(`   YouTube: /api/v1/youtube/search`);
  console.log(`   YT Key:  ${process.env.YOUTUBE_API_KEY ? '✅' : '⚠️  not set'}\n`);
});
