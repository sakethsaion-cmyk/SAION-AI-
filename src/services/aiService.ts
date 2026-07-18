import { Message, Personality } from '../types';
import { formatMemoriesForPrompt, extractMemoriesFromMessage, saveMemories } from '../modules/memory/memoryService';
import { webSearch, formatSearchResultsForPrompt, needsWebSearch, formatCitations } from '../modules/search/searchService';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'qwen/qwen-2.5-72b-instruct';

const VIDEO_EDITING_KNOWLEDGE = `
You are an expert video editor with deep knowledge of ALL video editing features:

CUTS & TRANSITIONS: Hard cut, J-cut, L-cut, match cut, jump cut, dissolve, fade in/out, wipe, crossfade, zoom transition, whip pan, smash cut, invisible cut.
COLOR GRADING: Brightness, contrast, saturation, hue, color temperature, white balance, LUTs, color curves, vignette, film grain, cinematic look, black and white.
SPEED & TIME: Slow motion, fast forward, freeze frame, reverse playback, speed ramp, hyperlapse, timelapse.
AUDIO: Background music, voiceover, SFX, audio fade, noise reduction, EQ, bass/treble, audio ducking, echo/reverb, pitch shift.
TEXT & TITLES: Lower thirds, title cards, subtitles, animated text, end cards, watermarks, credits.
EFFECTS: Blur, sharpen, glow, lens flare, chromatic aberration, film burn, VHS/retro, glitch, bokeh, HDR.
CROPPING: Crop, zoom, aspect ratio change (16:9, 9:16, 1:1), portrait to landscape, stabilization.
COMPOSITING: Green screen, picture-in-picture, split screen, overlay, masking.
STABILIZATION: Video stabilization, shake removal, upscaling, noise reduction.

When user uploads a video: always ask what edits they want, present a numbered list of planned edits, then confirm before applying.
`;

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  helpful: `You are SAION AI, a helpful and versatile AI assistant created by Saion Production. Be warm, knowledgeable, friendly. Respond in the same language as the user (English, Hindi, Telugu, etc). Use markdown formatting. Use code blocks for code.
${VIDEO_EDITING_KNOWLEDGE}`,
  technical: `You are SAION AI, a technical expert by Saion Production. Specialize in programming, engineering, science. Provide precise detailed answers. Respond in user's language. Use code blocks with syntax highlighting.
${VIDEO_EDITING_KNOWLEDGE}`,
  casual: `You are SAION AI, a casual friendly AI by Saion Production. Chat like a knowledgeable friend. Use conversational language, humor, emojis when fitting. Respond in user's language/style.
${VIDEO_EDITING_KNOWLEDGE}`,
  formal: `You are SAION AI, a formal professional AI by Saion Production. Use proper grammar, structured responses, professional terminology. Respond in user's language. Maintain a respectful businesslike tone.
${VIDEO_EDITING_KNOWLEDGE}`,
};

export interface StreamChunk {
  content: string;
  done: boolean;
}

let currentAbortController: AbortController | null = null;

export function stopCurrentResponse() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

export async function sendMessage(
  messages: Message[],
  personality: Personality,
  onChunk: (chunk: StreamChunk) => void,
  options?: { uid?: string; memoryContext?: string; enableSearch?: boolean; }
): Promise<void> {
  if (currentAbortController) currentAbortController.abort();
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  const systemPrompt = PERSONALITY_PROMPTS[personality];
  const formattedMessages = messages
    .filter(msg => msg.content && msg.content.trim().length > 0 && msg.content !== '\u25ae')
    .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));

  if (formattedMessages.length === 0) {
    onChunk({ content: 'Please send a message.', done: false });
    onChunk({ content: '', done: true });
    return;
  }

  // Build enhanced prompt with memory + live search
  let enhancedSystem = systemPrompt;
  const lastUserMsg = formattedMessages.filter(m => m.role === 'user').pop()?.content || '';
  let searchCitations = '';

  if (options?.memoryContext) {
    enhancedSystem += '\n\n' + options.memoryContext;
  }

  if (options?.enableSearch !== false && needsWebSearch(lastUserMsg)) {
    try {
      const searchRes = await webSearch(lastUserMsg);
      if (searchRes.results.length) {
        enhancedSystem += '\n\n' + formatSearchResultsForPrompt(searchRes);
        searchCitations = formatCitations(searchRes.results);
      }
    } catch { /* silent */ }
  }

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://saion.ai',
        'X-Title': 'SAION AI',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: enhancedSystem }, ...formattedMessages],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      let errorMsg = `Request failed (${response.status})`;
      try { const errorData = await response.json(); errorMsg = errorData?.error?.message || errorMsg; } catch {}
      throw new Error(errorMsg);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream received');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) onChunk({ content, done: false });
        } catch {}
      }
    }

    // Append search citations
    if (searchCitations) {
      onChunk({ content: searchCitations, done: false });
    }

    onChunk({ content: '', done: true });
    currentAbortController = null;

    // Extract and save memories in background
    if (options?.uid && lastUserMsg) {
      extractMemoriesFromMessage(lastUserMsg, lastUserMsg, OPENROUTER_API_KEY)
        .then(mems => { if (mems.length && options.uid) saveMemories(options.uid, mems, 'fact', 'auto'); })
        .catch(() => {});
    }

  } catch (error: unknown) {
    if ((error as Error)?.name === 'AbortError') { onChunk({ content: '', done: true }); return; }
    const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    throw new Error(message);
  }
}

// Intent Detection
export function detectIntent(message: string): {
  type: 'image' | 'website' | 'app' | 'project' | 'youtube' | 'normal';
  query?: string;
} {
  const lower = message.toLowerCase().trim();

  if (lower.match(/\b(generate|create|make|draw|design|show)\b.+\b(image|picture|photo|art|illustration|painting)\b/i)) {
    return { type: 'image', query: message };
  }

  if (lower.match(/\b(build|create|make|generate|design)\b.+\b(website|webpage|landing page|html)\b/i)) {
    return { type: 'website', query: message };
  }

  if (lower.match(/\b(open|launch|start)\b.+\b(whatsapp|chrome|gmail|maps|instagram|telegram|twitter|camera|settings|calculator|files|photos)\b/i)) {
    const appName = message.replace(/open|launch|start|the|app|application/gi, '').replace(/\s+/g, ' ').trim();
    return { type: 'app', query: appName };
  }

  if (lower.match(/\b(build|create|make|generate)\b.+\b(vscode|vs code|react app|next\.?js app|node app|express app|full.?stack|project|folder structure|complete project|web app)\b/i) ||
     lower.match(/\b(build me|create me|make me)\b.+(app|project|website|clone)\b/i)) {
    return { type: 'project', query: message };
  }

  // YouTube intent
  if (
    lower.includes('youtube') ||
    (lower.match(/\b(play|watch|find|search)\b/) && lower.match(/\b(video|videos|clip|trailer|channel)\b/)) ||
    lower.match(/\bplay\b.+\bon youtube\b/)
  ) {
    const query = message.replace(/play|watch|find|search for|on youtube|youtube|video|videos|clip|trailer/gi, '').replace(/\s+/g, ' ').trim() || message;
    return { type: 'youtube', query };
  }

  return { type: 'normal' };
}

// ── IMAGE GENERATION — HuggingFace FLUX + Pollinations fallback ──────────────
import { fal } from '@fal-ai/client';

const FAL_KEY = (import.meta.env.VITE_FAL_KEY as string | undefined) || '';
const HF_TOKEN = (import.meta.env.VITE_HF_TOKEN as string | undefined) || '';
if (FAL_KEY) fal.config({ credentials: FAL_KEY });

async function generateWithHuggingFace(prompt: string): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;
  const res = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
    method: 'POST',
    headers,
    body: JSON.stringify({ inputs: prompt.trim(), parameters: { num_inference_steps: 4 } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`HuggingFace error ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Not an image');
  return URL.createObjectURL(blob);
}

function generatePollinationsUrl(prompt: string): string {
  const seed = Math.floor(Math.random() * 9999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?width=1024&height=768&seed=${seed}&nologo=true&model=flux`;
}

async function generateWithPollinations(prompt: string): Promise<string> {
  const url = generatePollinationsUrl(prompt);
  await new Promise<void>((resolve) => {
    const img = new Image();
    const t = setTimeout(() => resolve(), 45_000);
    img.onload = () => { clearTimeout(t); resolve(); };
    img.onerror = () => { clearTimeout(t); resolve(); };
    img.src = url;
  });
  return url;
}

export async function generateImageWithFlux(prompt: string): Promise<string> {
  if (FAL_KEY) {
    try {
      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: { prompt: prompt.trim(), image_size: 'landscape_4_3', num_inference_steps: 4, num_images: 1, enable_safety_checker: true },
      }) as { images?: { url: string }[] };
      const url = result?.images?.[0]?.url;
      if (url) return url;
    } catch (e) { console.warn('fal.ai failed:', e); }
  }
  try { return await generateWithHuggingFace(prompt); } catch (e) { console.warn('HuggingFace failed:', e); }
  return generateWithPollinations(prompt);
}

// Website Generator
export async function generateWebsite(description: string): Promise<string> {
  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://saion.ai',
        'X-Title': 'SAION AI Website Builder',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are an expert web developer. Generate a complete beautiful single-file HTML website. IMPORTANT: Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no backticks, no explanation. Just pure HTML with embedded CSS and JavaScript.' },
          { role: 'user', content: `Build this website: ${description}` },
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });
    const data = await response.json();
    let html = data.choices?.[0]?.message?.content || '';
    html = html.replace(/^```html?\n?/i, '').replace(/```\s*$/i, '').trim();
    return html;
  } catch { return ''; }
}

// Auto-generate chat title
export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://saion.ai',
        'X-Title': 'SAION AI',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'Generate a short 3-5 word chat title for this message. Return ONLY the title, nothing else. No quotes, no punctuation at end.' },
          { role: 'user', content: firstMessage },
        ],
        stream: false,
        temperature: 0.5,
        max_tokens: 20,
      }),
    });
    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() || '';
    return title.length > 0 && title.length < 60 ? title : firstMessage.slice(0, 40);
  } catch { return firstMessage.slice(0, 40); }
}

// Video Edit Analysis
export async function analyzeVideoEditRequest(userRequest: string, videoName: string): Promise<string> {
  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://saion.ai',
        'X-Title': 'SAION AI Video Editor',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are SAION AI expert video editing assistant. User uploaded a video. List ALL possible edits as numbered items with emoji icons, grouped by category (Color, Speed, Audio, Text, Effects, Cropping). Each item: name + what it does + visual impact. End by asking which edits to apply or "edit all" for everything. Be enthusiastic and professional.',
          },
          {
            role: 'user',
            content: `Video: "${videoName}". Request: ${userRequest || 'Please analyze and suggest all edits for this video.'}`,
          },
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch { return ''; }
}

export interface VideoEditOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  warmth?: number;
  speed?: number;
  reverse?: boolean;
  grayscale?: boolean;
  sepia?: boolean;
  blur?: number;
  sharpen?: boolean;
  vignette?: boolean;
  addText?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
  fontSize?: number;
  filmGrain?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
  startTrim?: number;
  endTrim?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotation?: number;
}

// VS Code Project Generator
export async function generateVSCodeProject(description: string): Promise<{
  structure: string;
  files: { path: string; content: string }[];
  setup: string;
  techStack: string;
  projectName: string;
}> {
  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://saion.ai',
        'X-Title': 'SAION AI Project Generator',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert full-stack developer. Generate a COMPLETE working VS Code project.
Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "projectName": "my-app",
  "techStack": "React + Vite + Tailwind CSS",
  "structure": "my-app/\n├── index.html\n├── package.json\n└── src/\n    └── App.tsx",
  "setup": "npm install\nnpm run dev",
  "files": [
    { "path": "package.json", "content": "..." },
    { "path": "src/App.tsx", "content": "..." }
  ]
}
Rules:
- Include ALL files with COMPLETE code (no placeholders)
- Use React + Vite + Tailwind by default
- Add backend (Express) only if needed
- Make it production-ready and beautiful
- Max 8 files to keep it focused`
          },
          { role: 'user', content: `Build this project: ${description}` },
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });
    const data = await response.json();
    let raw = data.choices?.[0]?.message?.content || '{}';
    raw = raw.replace(/^```json?\n?/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);
    return {
      projectName: parsed.projectName || 'my-project',
      techStack: parsed.techStack || 'React + Vite',
      structure: parsed.structure || '',
      setup: parsed.setup || 'npm install\nnpm run dev',
      files: parsed.files || [],
    };
  } catch {
    return { projectName: 'my-project', techStack: '', structure: '', setup: '', files: [] };
  }
}

// ── Auto Deploy Website to Netlify via backend ───────────────────────────────
export async function deployWebsiteToNetlify(html: string, siteName: string): Promise<{
  url: string;
  expiresAt: string;
  error?: string;
}> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/deploy-website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, siteName }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Deployment failed');
    return { url: data.url, expiresAt: data.expiresAt };
  } catch (err) {
    return { url: '', expiresAt: '', error: err instanceof Error ? err.message : 'Deployment failed' };
  }
}
