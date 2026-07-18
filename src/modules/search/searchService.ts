export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  answeredAt: string;
  engine: string;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:5000';

async function searchViaBackend(query: string): Promise<SearchResult[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/search?q=${encodeURIComponent(query)}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error('Backend search failed');
  const data = await res.json();
  if (!data.success) throw new Error('Search failed');
  return data.data.results as SearchResult[];
}

async function searchDDGDirect(query: string): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error('DDG failed');
  const data = await res.json();
  const results: SearchResult[] = [];
  if (data.Abstract && data.AbstractURL) {
    results.push({ title: data.Heading || query, url: data.AbstractURL, snippet: data.Abstract, source: data.AbstractSource || new URL(data.AbstractURL).hostname });
  }
  if (data.Answer) {
    results.push({ title: 'Quick Answer', url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`, snippet: String(data.Answer), source: 'DuckDuckGo' });
  }
  for (const topic of (data.RelatedTopics || []).slice(0, 6)) {
    if (topic.Text && topic.FirstURL) {
      try { results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text, source: new URL(topic.FirstURL).hostname }); } catch { /* skip */ }
    }
  }
  return results.slice(0, 8);
}

export async function webSearch(query: string): Promise<SearchResponse> {
  const answeredAt = new Date().toISOString();
  try {
    const results = await searchViaBackend(query);
    if (results.length) return { results, query, answeredAt, engine: 'ddg-backend' };
  } catch { /* fallthrough */ }
  try {
    const results = await searchDDGDirect(query);
    return { results, query, answeredAt, engine: 'ddg-direct' };
  } catch { /* fallthrough */ }
  return { results: [], query, answeredAt, engine: 'none' };
}

export function formatSearchResultsForPrompt(response: SearchResponse): string {
  if (!response.results.length) return '';
  const lines = [`[LIVE SEARCH — DuckDuckGo — "${response.query}"]:`, ''];
  response.results.forEach((r, i) => {
    lines.push(`[${i + 1}] ${r.title}`);
    lines.push(`    Source: ${r.source}`);
    lines.push(`    ${r.snippet}`);
    lines.push('');
  });
  lines.push('Use these results. Cite as [1], [2] etc. Never make up facts.');
  return lines.join('\n');
}

export function needsWebSearch(message: string): boolean {
  const lower = message.toLowerCase();
  return ['latest','recent','current','today','news','now','price','weather','score','who is','what is the','when did','how much','search for','look up','find me','what happened','trending','2025','2026','this year','this week'].some(t => lower.includes(t));
}

export function formatCitations(results: SearchResult[]): string {
  if (!results.length) return '';
  const unique = results.filter((r, i, arr) => arr.findIndex(x => x.source === r.source) === i).slice(0, 4);
  return '\n\n---\n**🔍 Sources:**\n' + unique.map((r, i) => `[${i + 1}] [${r.source}](${r.url})`).join('\n');
}
