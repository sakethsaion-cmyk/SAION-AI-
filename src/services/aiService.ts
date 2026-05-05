import { Message, Personality } from '../types';

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
  onChunk: (chunk: StreamChunk) => void
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
        messages: [{ role: 'system', content: systemPrompt }, ...formattedMessages],
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

    onChunk({ content: '', done: true });
    currentAbortController = null;

  } catch (error: unknown) {
    if ((error as Error)?.name === 'AbortError') { onChunk({ content: '', done: true }); return; }
    const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    throw new Error(message);
  }
}

// Intent Detection
export function detectIntent(message: string): {
  type: 'image' | 'website' | 'app' | 'project' | 'normal';
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

  return { type: 'normal' };
}

// ── FAL.AI FLUX.1-SCHNELL IMAGE GENERATOR ────────────────────────────────────
// Uses @fal-ai/client SDK — handles CORS, retries, and queue properly
import { fal } from '@fal-ai/client';

fal.config({ credentials: '10ffaeaef31516afc38f5472ab6cd13e' });

export async function generateImageWithFlux(prompt: string): Promise<string> {
  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt: prompt.trim(),
      image_size: 'landscape_4_3',
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    },
  }) as { images?: { url: string }[] };

  const imageUrl = result?.images?.[0]?.url;
  if (!imageUrl) throw new Error('No image returned from fal.ai');
  return imageUrl;
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
