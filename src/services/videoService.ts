
// ============================================================
// SAION AI — videoService.ts  (SINGLE video processing file)
// Canvas API + MediaRecorder + ffmpeg.wasm (lazy-loaded)
// All processing is 100% local — Blob/Object URLs only
// ============================================================

import { VideoEditOptions } from './aiService';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VideoEditProgress {
  stage: string;
  percent: number;
}

export interface AudioEditOptions {
  action: 'mute' | 'keep' | 'replace' | 'adjustVolume';
  volume?: number;          // 0.0 – 2.0
  replacementFile?: File;   // user-uploaded MP3/WAV only
}

export interface TrimOptions {
  start: number;  // seconds
  end: number;    // seconds
}

export interface CropOptions {
  x: number; y: number; width: number; height: number;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | 'original';

export interface TransitionOptions {
  type: 'fadeIn' | 'fadeOut' | 'fadeBoth' | 'fadeToBlack' | 'fadeToWhite'
      | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown'
      | 'wipeLeft' | 'wipeRight' | 'zoomIn' | 'zoomOut' | 'blurTransition'
      | 'crossfade';
  durationFrames?: number;  // default = 24 (≈1 s at 24 fps)
}

// Full options exposed to callers
export interface FullVideoEditOptions extends VideoEditOptions {
  // Speed
  speed?: number;          // 0.25 – 4.0
  reverse?: boolean;

  // Trim
  startTrim?: number;
  endTrim?: number;

  // Colour
  brightness?: number;     // –100 … +100
  contrast?: number;
  saturation?: number;
  warmth?: number;
  grayscale?: boolean;
  sepia?: boolean;
  hdr?: boolean;

  // Effects
  blur?: number;           // 1 – 10
  sharpen?: boolean;
  vignette?: boolean;
  filmGrain?: boolean;

  // Transform
  rotation?: number;       // 0 | 90 | 180 | 270
  flipHorizontal?: boolean;
  flipVertical?: boolean;

  // Transitions
  fadeIn?: boolean;
  fadeOut?: boolean;
  transition?: TransitionOptions;

  // Crop / resize
  crop?: CropOptions;
  aspectRatio?: AspectRatio;

  // Text overlay
  addText?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
  fontSize?: number;

  // Audio
  mute?: boolean;
  audio?: AudioEditOptions;
}

// ─── ffmpeg.wasm lazy loader ──────────────────────────────────────────────────

let _ffmpegInstance: any = null;
let _ffmpegLoading = false;
let _ffmpegReady = false;
const _ffmpegReadyCallbacks: Array<() => void> = [];

export async function loadFfmpeg(
  onProgress?: (p: VideoEditProgress) => void
): Promise<any> {
  if (_ffmpegReady && _ffmpegInstance) return _ffmpegInstance;

  if (_ffmpegLoading) {
    return new Promise(res => {
      _ffmpegReadyCallbacks.push(() => res(_ffmpegInstance));
    });
  }

  _ffmpegLoading = true;
  onProgress?.({ stage: 'Loading ffmpeg.wasm…', percent: 5 });

  try {
    // Dynamically import @ffmpeg/ffmpeg (must be installed: npm i @ffmpeg/ffmpeg @ffmpeg/util)
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    // Load from CDN — no self-hosting needed
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    _ffmpegInstance = ffmpeg;
    _ffmpegReady = true;
    _ffmpegLoading = false;
    _ffmpegReadyCallbacks.forEach(cb => cb());
    _ffmpegReadyCallbacks.length = 0;

    onProgress?.({ stage: 'ffmpeg.wasm ready', percent: 15 });
    return ffmpeg;
  } catch (err) {
    _ffmpegLoading = false;
    console.warn('[videoService] ffmpeg.wasm not available — falling back to Canvas API:', err);
    return null; // caller falls back to Canvas
  }
}

export function isFfmpegReady(): boolean { return _ffmpegReady; }

// ─── Command parser ───────────────────────────────────────────────────────────

export interface ParsedCommand {
  action?: 'trim' | 'speed' | 'filter' | 'text' | 'audio' | 'rotate'
         | 'flip' | 'reverse' | 'crop' | 'transition' | 'preset';
  opts: FullVideoEditOptions;
  audioOpts?: AudioEditOptions;
  description: string[];
}

export function parseEditRequest(message: string): FullVideoEditOptions {
  const lower = message.toLowerCase();
  const opts: FullVideoEditOptions = {};

  // ── Trim ──────────────────────────────────────────────────────────────────
  const trimMatch = lower.match(/trim\s+(?:first\s+)?(\d+(?:\.\d+)?)\s*(?:to|[-–])\s*(\d+(?:\.\d+)?)\s*s/);
  if (trimMatch) { opts.startTrim = parseFloat(trimMatch[1]); opts.endTrim = parseFloat(trimMatch[2]); }
  const keepMatch = lower.match(/keep\s+(?:seconds?\s+)?(\d+(?:\.\d+)?)\s+to\s+(\d+(?:\.\d+)?)/);
  if (keepMatch) { opts.startTrim = parseFloat(keepMatch[1]); opts.endTrim = parseFloat(keepMatch[2]); }
  const trimFirstMatch = lower.match(/trim\s+first\s+(\d+(?:\.\d+)?)\s*s/);
  if (trimFirstMatch) { opts.startTrim = parseFloat(trimFirstMatch[1]); }
  const removeFirstMatch = lower.match(/remove\s+first\s+(\d+(?:\.\d+)?)\s*s/);
  if (removeFirstMatch) { opts.startTrim = parseFloat(removeFirstMatch[1]); }

  // ── Speed ─────────────────────────────────────────────────────────────────
  const slowMatch = lower.match(/slow(?:\s*motion)?(?:\s+([\d.]+)x)?/);
  if (slowMatch) opts.speed = slowMatch[1] ? Math.max(0.25, parseFloat(slowMatch[1])) : 0.5;
  const fastMatch = lower.match(/(?:speed\s*up|fast(?:er)?)(?:\s+([\d.]+)x)?/);
  if (fastMatch) opts.speed = fastMatch[1] ? Math.min(4, parseFloat(fastMatch[1])) : 2;
  if (/\b2x\b/.test(lower)) opts.speed = 2;
  if (/\b3x\b/.test(lower)) opts.speed = 3;
  if (/\b4x\b/.test(lower)) opts.speed = 4;
  if (/\b0\.5x\b|half\s*speed/.test(lower)) opts.speed = 0.5;
  if (/\breverse\b|\brewind\b/.test(lower)) opts.reverse = true;

  // ── Colour ────────────────────────────────────────────────────────────────
  if (/\bbright(?:en)?\b|\blighten\b/.test(lower)) opts.brightness = 30;
  if (/\bdark(?:en)?\b|\bshadow\b/.test(lower)) opts.brightness = -30;
  const briVal = lower.match(/brightness\s*([+-]?\d+)/);
  if (briVal) opts.brightness = parseInt(briVal[1]);
  if (/\bcontrast\b/.test(lower)) opts.contrast = 40;
  const conVal = lower.match(/contrast\s*([+-]?\d+)/);
  if (conVal) opts.contrast = parseInt(conVal[1]);
  if (/\bsaturat\b|\bvivid\b|\bcolorful\b/.test(lower)) opts.saturation = 50;
  if (/\bdesaturat\b|\bmuted?\b/.test(lower)) opts.saturation = -50;
  if (/\bwarm\b/.test(lower)) opts.warmth = 40;
  if (/\bcool\b|\bcold\b/.test(lower)) opts.warmth = -40;
  if (/\bblack\s*(?:and|&)\s*white\b|\bb&w\b|\bgrayscale\b|\bgreyscale\b/.test(lower)) opts.grayscale = true;
  if (/\bsepia\b|\bvintage\b|\bold\s*film\b/.test(lower)) opts.sepia = true;
  if (/\bcinematic\b/.test(lower)) { opts.contrast = 25; opts.saturation = -10; opts.vignette = true; }
  if (/\bhdr\b/.test(lower)) { opts.contrast = 35; opts.saturation = 25; opts.sharpen = true; }

  // ── Effects ───────────────────────────────────────────────────────────────
  if (/\bblur\b|\bsoft\s*focus\b/.test(lower)) opts.blur = 4;
  const blurVal = lower.match(/blur\s+(\d+)/);
  if (blurVal) opts.blur = Math.min(10, parseInt(blurVal[1]));
  if (/\bsharpen\b|\bcrisp\b/.test(lower)) opts.sharpen = true;
  if (/\bvignette\b/.test(lower)) opts.vignette = true;
  if (/\bfilm\s*grain\b|\bgrain\b/.test(lower)) opts.filmGrain = true;

  // ── Transform ─────────────────────────────────────────────────────────────
  if (/\bflip\s*horizontal\b|\bmirror\b/.test(lower)) opts.flipHorizontal = true;
  if (/\bflip\s*vertical\b|\bupside\s*down\b/.test(lower)) opts.flipVertical = true;
  if (/\brotate\s*90\b|\bportrait\b/.test(lower)) opts.rotation = 90;
  if (/\brotate\s*180\b/.test(lower)) opts.rotation = 180;

  // ── Transitions ───────────────────────────────────────────────────────────
  if (/\bfade\s*in\b/.test(lower)) opts.fadeIn = true;
  if (/\bfade\s*out\b/.test(lower)) opts.fadeOut = true;
  if (/\bfade\b/.test(lower) && !opts.fadeIn && !opts.fadeOut) { opts.fadeIn = true; opts.fadeOut = true; }
  if (/\bslide\s*left\b/.test(lower)) opts.transition = { type: 'slideLeft' };
  if (/\bslide\s*right\b/.test(lower)) opts.transition = { type: 'slideRight' };
  if (/\bzoom\s*in\b/.test(lower)) opts.transition = { type: 'zoomIn' };
  if (/\bzoom\s*out\b/.test(lower)) opts.transition = { type: 'zoomOut' };
  if (/\bblur\s*transition\b/.test(lower)) opts.transition = { type: 'blurTransition' };

  // ── Aspect Ratio ──────────────────────────────────────────────────────────
  if (/\b9:16\b|\bvertical\b|\bportrait\b|\breels?\b|\bshorts?\b/.test(lower)) opts.aspectRatio = '9:16';
  if (/\b1:1\b|\bsquare\b/.test(lower)) opts.aspectRatio = '1:1';
  if (/\b16:9\b|\blandscape\b|\bwidescreen\b/.test(lower)) opts.aspectRatio = '16:9';

  // ── Text Overlay ──────────────────────────────────────────────────────────
  const textMatch = message.match(/add\s+text[:\s]+["']?([^"'\n]{2,80})["']?/i)
    || message.match(/text\s+overlay[:\s]+["']?([^"'\n]{2,80})["']?/i)
    || message.match(/watermark[:\s]+["']?([^"'\n]{2,80})["']?/i)
    || message.match(/subtitle[:\s]+["']?([^"'\n]{2,80})["']?/i);
  if (textMatch) {
    opts.addText = textMatch[1].trim();
    opts.textPosition = /\btop\b/.test(lower) ? 'top' : /\bcenter\b/.test(lower) ? 'center' : 'bottom';
    opts.textColor = /\bred\b/.test(lower) ? '#ff4444'
      : /\bblue\b/.test(lower) ? '#4488ff'
      : /\bgreen\b/.test(lower) ? '#44ff88'
      : /\byellow\b/.test(lower) ? '#ffdd44'
      : '#ffffff';
    opts.fontSize = /\blarge\b|\bbig\b/.test(lower) ? 48 : /\bsmall\b/.test(lower) ? 22 : 36;
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  if (/\bmute\b|\bsilent\b|\bno\s*audio\b/.test(lower)) opts.mute = true;

  // ── Presets (edit all / enhance) ─────────────────────────────────────────
  if (/\bedit\s*all\b|\bapply\s*all\b|\benhance\b|\beverything\b/.test(lower)) {
    opts.brightness = 10; opts.contrast = 20; opts.saturation = 15;
    opts.sharpen = true; opts.vignette = true; opts.fadeIn = true; opts.fadeOut = true;
  }

  return opts;
}

export function parseStructuredCommand(message: string): ParsedCommand {
  const lower = message.toLowerCase();
  const opts = parseEditRequest(message);
  const description = describeEdits(opts);
  let action: ParsedCommand['action'] = undefined;

  if (/trim|cut|keep\s+seconds/.test(lower)) action = 'trim';
  else if (/speed|slow|fast|reverse/.test(lower)) action = 'speed';
  else if (/black.*white|sepia|cinematic|hdr|warm|cool|bright|contrast/.test(lower)) action = 'filter';
  else if (/add\s+text|watermark|subtitle/.test(lower)) action = 'text';
  else if (/mute|audio|volume/.test(lower)) action = 'audio';
  else if (/rotate/.test(lower)) action = 'rotate';
  else if (/flip|mirror/.test(lower)) action = 'flip';
  else if (/fade|slide|zoom\s+transition|blur\s+transition/.test(lower)) action = 'transition';

  let audioOpts: AudioEditOptions | undefined;
  if (/mute/.test(lower)) audioOpts = { action: 'mute' };
  else if (/replace\s+audio/.test(lower)) audioOpts = { action: 'replace' };
  else if (/keep\s+(?:original\s+)?audio/.test(lower)) audioOpts = { action: 'keep' };
  else if (/adjust\s+volume|volume/.test(lower)) {
    const volMatch = lower.match(/volume\s+([\d.]+)/);
    audioOpts = { action: 'adjustVolume', volume: volMatch ? parseFloat(volMatch[1]) : 0.8 };
  }

  return { action, opts, audioOpts, description };
}

// ─── Describe edits ───────────────────────────────────────────────────────────

export function describeEdits(opts: FullVideoEditOptions): string[] {
  const out: string[] = [];
  if (opts.startTrim !== undefined || opts.endTrim !== undefined) {
    out.push(`Trimmed: ${opts.startTrim ?? 0}s → ${opts.endTrim !== undefined ? opts.endTrim + 's' : 'end'}`);
  }
  if (opts.speed !== undefined) out.push(opts.speed < 1 ? `Slow motion (${opts.speed}x)` : `Speed up (${opts.speed}x)`);
  if (opts.reverse) out.push('Reversed playback');
  if (opts.brightness !== undefined) out.push(opts.brightness > 0 ? 'Increased brightness' : 'Decreased brightness');
  if (opts.contrast !== undefined) out.push('Adjusted contrast');
  if (opts.saturation !== undefined) out.push(opts.saturation > 0 ? 'Boosted saturation' : 'Reduced saturation');
  if (opts.warmth !== undefined) out.push(opts.warmth > 0 ? 'Warm colour tone' : 'Cool colour tone');
  if (opts.grayscale) out.push('Black & white');
  if (opts.sepia) out.push('Sepia / vintage');
  if (opts.vignette) out.push('Cinematic vignette');
  if (opts.filmGrain) out.push('Film grain');
  if (opts.blur) out.push('Blur effect');
  if (opts.sharpen) out.push('Sharpened');
  if (opts.fadeIn) out.push('Fade in');
  if (opts.fadeOut) out.push('Fade out');
  if (opts.transition) out.push(`Transition: ${opts.transition.type}`);
  if (opts.flipHorizontal) out.push('Mirrored horizontally');
  if (opts.flipVertical) out.push('Flipped vertically');
  if (opts.rotation) out.push(`Rotated ${opts.rotation}°`);
  if (opts.aspectRatio) out.push(`Resized to ${opts.aspectRatio}`);
  if (opts.addText) out.push(`Text overlay: "${opts.addText}"`);
  if (opts.mute) out.push('Audio muted');
  if (opts.audio?.action === 'replace') out.push('Audio replaced');
  if (opts.audio?.action === 'adjustVolume') out.push(`Volume → ${(opts.audio.volume ?? 1) * 100}%`);
  return out;
}

// ─── Intent detector for AI quick-action chips ───────────────────────────────

export interface VideoIntent {
  type: 'trim' | 'effects' | 'captions' | 'speed' | 'reel' | 'audio' | 'custom';
  opts?: FullVideoEditOptions;
  audioOpts?: AudioEditOptions;
}

export function detectVideoIntent(message: string): VideoIntent {
  const lower = message.toLowerCase();
  if (/\btrim\b|\bcut\b/.test(lower)) return { type: 'trim', opts: { startTrim: 0 } };
  if (/\beffect\b|\bfilter\b|\bcinematic\b|\bcolor\b|\bcolour\b/.test(lower)) return { type: 'effects', opts: { contrast: 25, saturation: -10, vignette: true } };
  if (/\bcaption\b|\bsubtitle\b|\btext\b/.test(lower)) return { type: 'captions', opts: { addText: '', textPosition: 'bottom' } };
  if (/\bspeed\b|\bslow\b|\bfast\b/.test(lower)) return { type: 'speed', opts: { speed: 0.5 } };
  if (/\breel\b|\bshort\b|\btiktok\b|\binstagram\b/.test(lower)) return { type: 'reel', opts: { aspectRatio: '9:16', fadeIn: true, fadeOut: true } };
  if (/\baudio\b|\bsound\b|\bmusic\b|\bmute\b/.test(lower)) return { type: 'audio', audioOpts: { action: 'keep' } };
  const parsed = parseStructuredCommand(message);
  return { type: 'custom', opts: parsed.opts, audioOpts: parsed.audioOpts };
}

// ─── Canvas colour grading ────────────────────────────────────────────────────

function applyColorGrading(
  imgData: ImageData,
  opts: FullVideoEditOptions,
  frame: number,
  totalFrames: number
) {
  const d = imgData.data;
  const brightness = (opts.brightness || 0) * 2.55;
  const contrast   = opts.contrast   ? ((opts.contrast + 100) / 100) ** 2 : 1;
  const saturation = opts.saturation !== undefined ? (opts.saturation + 100) / 100 : 1;
  const warmth     = opts.warmth || 0;

  // Fade multiplier
  const fadeWindow = Math.max(1, totalFrames * 0.08);
  let fade = 1;
  if (opts.fadeIn  && frame < fadeWindow) fade = Math.min(1, frame / fadeWindow);
  if (opts.fadeOut && frame > totalFrames - fadeWindow) fade = Math.min(1, (totalFrames - frame) / fadeWindow);

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];

    r += brightness; g += brightness; b += brightness;
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    r += warmth * 0.8; b -= warmth * 0.8;

    if (opts.grayscale) {
      const gr = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gr;
    } else if (opts.sepia) {
      const or = r, og = g, ob = b;
      r = or * 0.393 + og * 0.769 + ob * 0.189;
      g = or * 0.349 + og * 0.686 + ob * 0.168;
      b = or * 0.272 + og * 0.534 + ob * 0.131;
    }

    if (saturation !== 1 && !opts.grayscale) {
      const gr = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gr + (r - gr) * saturation;
      g = gr + (g - gr) * saturation;
      b = gr + (b - gr) * saturation;
    }

    if (opts.filmGrain) {
      const grain = (Math.random() - 0.5) * 18;
      r += grain; g += grain; b += grain;
    }

    if (fade < 1) { r *= fade; g *= fade; b *= fade; }

    // Transition effects on top of fade
    if (opts.transition) {
      const t = frame / totalFrames;
      if (opts.transition.type === 'fadeToBlack' && t > 0.85) {
        const m = 1 - (t - 0.85) / 0.15;
        r *= m; g *= m; b *= m;
      }
      if (opts.transition.type === 'fadeToWhite' && t > 0.85) {
        const m = (t - 0.85) / 0.15;
        r = r + (255 - r) * m;
        g = g + (255 - g) * m;
        b = b + (255 - b) * m;
      }
      if (opts.transition.type === 'blurTransition' && (t < 0.05 || t > 0.95)) {
        // handled in sharpen pass — skip colour only
      }
    }

    d[i]     = Math.max(0, Math.min(255, r));
    d[i + 1] = Math.max(0, Math.min(255, g));
    d[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Vignette (separate pass — cheaper than inner loop branch)
  if (opts.vignette) {
    const W = imgData.width, H = imgData.height;
    const cx = W / 2, cy = H / 2, maxD = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const factor = 1 - Math.pow(dist / maxD, 1.6) * 0.65;
        const idx = (y * W + x) * 4;
        d[idx]     = Math.round(d[idx]     * factor);
        d[idx + 1] = Math.round(d[idx + 1] * factor);
        d[idx + 2] = Math.round(d[idx + 2] * factor);
      }
    }
  }
}

// ─── Canvas blur (box blur for sharpen/blur effects) ─────────────────────────

function applyBoxBlur(ctx: CanvasRenderingContext2D, w: number, h: number, radius: number) {
  ctx.filter = `blur(${radius}px)`;
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const tmpCtx = tmp.getContext('2d')!;
  tmpCtx.drawImage(ctx.canvas, 0, 0);
  ctx.filter = 'none';
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tmp, 0, 0);
}

// ─── Text overlay renderer ────────────────────────────────────────────────────

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  opts: FullVideoEditOptions,
  w: number, h: number
) {
  if (!opts.addText) return;
  const fs  = opts.fontSize || 36;
  const col = opts.textColor || '#ffffff';
  const pos = opts.textPosition || 'bottom';

  ctx.save();
  ctx.font = `bold ${fs}px "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const barH = fs + 24;
  const barY = pos === 'top' ? 0 : pos === 'center' ? (h - barH) / 2 : h - barH;

  // Background bar
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, barY, w, barH);

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = col;
  ctx.fillText(opts.addText, w / 2, barY + barH / 2);
  ctx.restore();
}

// ─── Transition overlay (slide / wipe / zoom on canvas) ──────────────────────

function applyTransitionOverlay(
  ctx: CanvasRenderingContext2D,
  opts: FullVideoEditOptions,
  w: number, h: number,
  frame: number, totalFrames: number
) {
  if (!opts.transition) return;
  const t = frame / totalFrames;
  const type = opts.transition.type;
  const WINDOW = 0.12; // transition covers first/last 12% of clip

  ctx.save();

  // Slide-in from left (beginning)
  if (type === 'slideLeft' && t < WINDOW) {
    const progress = t / WINDOW;
    const offsetX = -w * (1 - progress);
    const snap = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(snap, offsetX, 0);
  }
  // Slide-in from right (beginning)
  if (type === 'slideRight' && t < WINDOW) {
    const progress = t / WINDOW;
    const offsetX = w * (1 - progress);
    const snap = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(snap, offsetX, 0);
  }
  // Slide-in from top
  if (type === 'slideUp' && t < WINDOW) {
    const progress = t / WINDOW;
    const offsetY = -h * (1 - progress);
    const snap = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(snap, 0, offsetY);
  }
  // Wipe left (black curtain reveals left-to-right)
  if (type === 'wipeLeft' && t < WINDOW) {
    const revealWidth = w * (t / WINDOW);
    ctx.fillStyle = '#000';
    ctx.fillRect(revealWidth, 0, w - revealWidth, h);
  }
  // Wipe right
  if (type === 'wipeRight' && t < WINDOW) {
    const revealWidth = w * (t / WINDOW);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w - revealWidth, h);
  }
  // Zoom in (scale up slightly at start)
  if (type === 'zoomIn' && t < WINDOW) {
    const scale = 1 + (1 - t / WINDOW) * 0.2;
    const ox = (w - w * scale) / 2;
    const oy = (h - h * scale) / 2;
    const snap = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
    ctx.putImageData(snap, 0, 0);
    ctx.restore();
  }
  // Zoom out (scale in at start)
  if (type === 'zoomOut' && t < WINDOW) {
    const scale = 0.8 + (t / WINDOW) * 0.2;
    const snap = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-w / 2, -h / 2);
    ctx.putImageData(snap, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

// ─── Compute output dimensions for aspect ratio ───────────────────────────────

function computeDimensions(
  origW: number, origH: number,
  opts: FullVideoEditOptions
): { canvasW: number; canvasH: number; srcX: number; srcY: number; srcW: number; srcH: number } {
  const MAX_DIM = 1280;

  // Custom crop takes highest priority
  if (opts.crop) {
    const { x, y, width, height } = opts.crop;
    const scale = Math.min(1, MAX_DIM / Math.max(width, height));
    return { canvasW: Math.round(width * scale), canvasH: Math.round(height * scale), srcX: x, srcY: y, srcW: width, srcH: height };
  }

  let targetW = origW, targetH = origH;
  if (opts.aspectRatio === '9:16') { targetW = Math.round(origH * 9 / 16); targetH = origH; }
  else if (opts.aspectRatio === '1:1') { const s = Math.min(origW, origH); targetW = s; targetH = s; }
  else if (opts.aspectRatio === '16:9') { targetW = origW; targetH = Math.round(origW * 9 / 16); }

  const srcX = Math.round((origW - targetW) / 2);
  const srcY = Math.round((origH - targetH) / 2);

  if (opts.rotation === 90 || opts.rotation === 270) {
    [targetW, targetH] = [targetH, targetW];
  }

  const scale = Math.min(1, MAX_DIM / Math.max(targetW, targetH));
  return {
    canvasW: Math.round(targetW * scale),
    canvasH: Math.round(targetH * scale),
    srcX, srcY,
    srcW: opts.aspectRatio ? targetW : origW,
    srcH: opts.aspectRatio ? targetH : origH,
  };
}

// ─── Main Canvas processor ───────────────────────────────────────────────────

export async function processVideoWithCanvas(
  videoFile: File,
  opts: FullVideoEditOptions,
  onProgress: (p: VideoEditProgress) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted   = true;
    video.playsInline = true;
    video.preload = 'auto';
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    video.onloadedmetadata = async () => {
      try {
        const origW    = video.videoWidth;
        const origH    = video.videoHeight;
        const fullDur  = video.duration;

        // Trim boundaries
        const trimStart = Math.max(0, opts.startTrim ?? 0);
        const trimEnd   = Math.min(fullDur, opts.endTrim ?? fullDur);
        const duration  = trimEnd - trimStart;

        if (duration <= 0) throw new Error('Trim range is invalid (start >= end).');

        const { canvasW, canvasH, srcX, srcY, srcW, srcH } = computeDimensions(origW, origH, opts);

        const canvas  = document.createElement('canvas');
        canvas.width  = canvasW;
        canvas.height = canvasH;
        const ctx     = canvas.getContext('2d', { willReadFrequently: true })!;

        const speed       = Math.max(0.05, opts.speed ?? 1);
        const fps         = 24;
        const totalFrames = Math.max(1, Math.floor(duration * fps / speed));

        // MediaRecorder MIME
        const mimes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
        const mimeType = mimes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

        const stream   = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 });
        const chunks: Blob[] = [];

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(new Blob(chunks, { type: mimeType }));
        };

        recorder.start(100);
        onProgress({ stage: 'Starting render…', percent: 0 });

        let frameIndex = 0;

        const renderNext = async (): Promise<void> => {
          if (frameIndex >= totalFrames) {
            recorder.stop();
            onProgress({ stage: 'Finalising…', percent: 100 });
            return;
          }

          if (frameIndex % 12 === 0) {
            const pct = Math.round((frameIndex / totalFrames) * 95);
            onProgress({ stage: `Rendering frame ${frameIndex}/${totalFrames}…`, percent: pct });
          }

          // Source time accounting for speed + trim + reverse
          let srcTime = opts.reverse
            ? trimStart + (duration - frameIndex * (1 / fps) * speed)
            : trimStart + frameIndex * (1 / fps) * speed;
          srcTime = Math.max(trimStart, Math.min(trimEnd - 0.02, srcTime));

          video.currentTime = srcTime;
          await new Promise<void>(res => {
            const h = () => { video.removeEventListener('seeked', h); res(); };
            video.addEventListener('seeked', h, { once: true });
          });

          ctx.save();

          // ── Draw frame with rotation / flip / crop ─────────────────────
          const rot = opts.rotation || 0;
          if (rot || opts.flipHorizontal || opts.flipVertical) {
            ctx.translate(canvasW / 2, canvasH / 2);
            if (rot) ctx.rotate((rot * Math.PI) / 180);
            ctx.scale(opts.flipHorizontal ? -1 : 1, opts.flipVertical ? -1 : 1);
            ctx.translate(-canvasW / 2, -canvasH / 2);
          }

          ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH);
          ctx.restore();

          // ── Blur (before pixel grading for accuracy) ──────────────────
          if (opts.blur && opts.blur > 0) {
            applyBoxBlur(ctx, canvasW, canvasH, opts.blur);
          }

          // ── Sharpen (unsharp mask via canvas filter) ───────────────────
          if (opts.sharpen) {
            ctx.filter = 'contrast(1.1) saturate(1.05)';
            const snap = ctx.getImageData(0, 0, canvasW, canvasH);
            ctx.filter = 'none';
            ctx.putImageData(snap, 0, 0);
          }

          // ── Pixel-level colour grading ─────────────────────────────────
          const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
          applyColorGrading(imgData, opts, frameIndex, totalFrames);
          ctx.putImageData(imgData, 0, 0);

          // ── Transition overlay ─────────────────────────────────────────
          applyTransitionOverlay(ctx, opts, canvasW, canvasH, frameIndex, totalFrames);

          // ── Text overlay ───────────────────────────────────────────────
          if (opts.addText) drawTextOverlay(ctx, opts, canvasW, canvasH);

          frameIndex++;
          // Yield to browser each frame to keep UI responsive
          await new Promise<void>(r => requestAnimationFrame(() => r()));
          return renderNext();
        };

        await renderNext();

      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video file. Make sure it is a valid MP4/WebM/MOV.'));
    };
    video.load();
  });
}

// ─── ffmpeg-based processor (faster, supports audio ops) ─────────────────────

export async function processVideoWithFfmpeg(
  videoFile: File,
  opts: FullVideoEditOptions,
  onProgress: (p: VideoEditProgress) => void
): Promise<Blob> {
  onProgress({ stage: 'Loading ffmpeg.wasm…', percent: 3 });
  const ffmpeg = await loadFfmpeg(onProgress);
  if (!ffmpeg) {
    // graceful fallback
    onProgress({ stage: 'ffmpeg unavailable, using Canvas…', percent: 10 });
    return processVideoWithCanvas(videoFile, opts, onProgress);
  }

  const { fetchFile } = await import('@ffmpeg/util');

  onProgress({ stage: 'Writing input file…', percent: 18 });
  const inputName  = 'input_' + Date.now() + '.mp4';
  const outputName = 'output_' + Date.now() + '.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

  const filters: string[] = [];
  const args: string[]    = ['-i', inputName];

  // ── Trim ─────────────────────────────────────────────────────────────────
  if (opts.startTrim !== undefined) args.push('-ss', String(opts.startTrim));
  if (opts.endTrim   !== undefined) args.push('-to', String(opts.endTrim));

  // ── Speed (setpts + atempo) ───────────────────────────────────────────────
  const speed = opts.speed ?? 1;
  if (speed !== 1) {
    filters.push(`setpts=${(1 / speed).toFixed(4)}*PTS`);
  }

  // ── Colour grading (eq filter) ─────────────────────────────────────────
  const eq: string[] = [];
  if (opts.brightness) eq.push(`brightness=${(opts.brightness / 100).toFixed(2)}`);
  if (opts.contrast)   eq.push(`contrast=${(1 + opts.contrast / 100).toFixed(2)}`);
  if (opts.saturation) eq.push(`saturation=${(1 + opts.saturation / 100).toFixed(2)}`);
  if (eq.length) filters.push(`eq=${eq.join(':')}`);

  // ── Grayscale ─────────────────────────────────────────────────────────────
  if (opts.grayscale) filters.push('hue=s=0');

  // ── Blur ──────────────────────────────────────────────────────────────────
  if (opts.blur)    filters.push(`boxblur=${opts.blur}:${opts.blur}`);
  if (opts.sharpen) filters.push('unsharp=5:5:1.5:5:5:0');

  // ── Vignette ──────────────────────────────────────────────────────────────
  if (opts.vignette) filters.push('vignette=angle=PI/4');

  // ── Flip / Rotate ─────────────────────────────────────────────────────────
  if (opts.flipHorizontal)  filters.push('hflip');
  if (opts.flipVertical)    filters.push('vflip');
  if (opts.rotation === 90)  filters.push('transpose=1');
  if (opts.rotation === 180) filters.push('transpose=1,transpose=1');
  if (opts.rotation === 270) filters.push('transpose=2');

  // ── Fade in/out ───────────────────────────────────────────────────────────
  if (opts.fadeIn)  filters.push('fade=t=in:st=0:d=0.8');
  if (opts.fadeOut) filters.push(`fade=t=out:st=${Math.max(0, (opts.endTrim ?? 0) - 0.8)}:d=0.8`);

  // ── Aspect ratio crop ─────────────────────────────────────────────────────
  if (opts.aspectRatio === '9:16') filters.push('crop=ih*9/16:ih');
  else if (opts.aspectRatio === '1:1') filters.push('crop=min(iw\\,ih):min(iw\\,ih)');

  // ── Text overlay ──────────────────────────────────────────────────────────
  if (opts.addText) {
    const y = opts.textPosition === 'top' ? '20' : opts.textPosition === 'center' ? '(h-text_h)/2' : 'h-th-20';
    const safe = opts.addText.replace(/'/g, "\\'").replace(/:/g, '\\:');
    filters.push(`drawtext=text='${safe}':fontsize=${opts.fontSize || 36}:fontcolor=${opts.textColor || 'white'}:x=(w-tw)/2:y=${y}:shadowcolor=black:shadowx=2:shadowy=2`);
  }

  if (filters.length) {
    args.push('-vf', filters.join(','));
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  if (opts.mute || opts.audio?.action === 'mute') {
    args.push('-an');
  } else if (opts.audio?.action === 'replace' && opts.audio.replacementFile) {
    const audioName = 'audio_' + Date.now() + '.mp3';
    await ffmpeg.writeFile(audioName, await fetchFile(opts.audio.replacementFile));
    args.splice(0, 0, '-i', audioName);   // add as second input
    args.push('-map', '0:v:0', '-map', '1:a:0', '-shortest');
  } else if (opts.audio?.action === 'adjustVolume' && opts.audio.volume !== undefined) {
    args.push('-af', `volume=${opts.audio.volume.toFixed(2)}`);
  } else if (speed !== 1) {
    // adjust audio tempo to match speed
    const clamp = Math.max(0.5, Math.min(2, speed));
    args.push('-af', `atempo=${clamp.toFixed(2)}`);
  } else {
    args.push('-c:a', 'copy');
  }

  args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-movflags', '+faststart', outputName);

  onProgress({ stage: 'Processing with ffmpeg.wasm…', percent: 35 });

  await ffmpeg.exec(args);

  onProgress({ stage: 'Reading output…', percent: 88 });
  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data], { type: 'video/mp4' });

  // cleanup
  try { await ffmpeg.deleteFile(inputName); } catch {}
  try { await ffmpeg.deleteFile(outputName); } catch {}

  onProgress({ stage: 'Done!', percent: 100 });
  return blob;
}

// ─── Smart dispatcher — tries ffmpeg, falls back to Canvas ───────────────────

export async function processVideo(
  videoFile: File,
  opts: FullVideoEditOptions,
  onProgress: (p: VideoEditProgress) => void,
  preferFfmpeg = true
): Promise<{ blob: Blob; objectUrl: string }> {
  let blob: Blob;
  try {
    if (preferFfmpeg) {
      blob = await processVideoWithFfmpeg(videoFile, opts, onProgress);
    } else {
      blob = await processVideoWithCanvas(videoFile, opts, onProgress);
    }
  } catch (err) {
    if (preferFfmpeg) {
      console.warn('[videoService] ffmpeg failed, falling back to Canvas:', err);
      onProgress({ stage: 'Switching to Canvas fallback…', percent: 5 });
      blob = await processVideoWithCanvas(videoFile, opts, onProgress);
    } else {
      throw err;
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  return { blob, objectUrl };
}

// ─── Auto-export helper — call this after any edit pipeline ──────────────────

export function createDownloadLink(blob: Blob, filename: string): string {
  return URL.createObjectURL(blob);
}

export function triggerDownload(objectUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href     = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Thumbnail extractor ─────────────────────────────────────────────────────

export async function extractVideoThumbnail(file: File): Promise<string> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.currentTime = 1;

    const done = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = 320;
      canvas.height = Math.max(1, Math.round(video.videoHeight / video.videoWidth * 320));
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    video.onseeked = done;
    video.onerror  = () => { URL.revokeObjectURL(url); resolve(''); };
    video.load();
  });
}

// ─── Audio upload validator ───────────────────────────────────────────────────

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/aac', 'audio/m4a'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const validExt = ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext);
  if (!allowed.includes(file.type) && !validExt) {
    return { valid: false, error: 'Please upload an MP3 or WAV audio file.' };
  }
  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: 'Audio file is too large (max 100 MB).' };
  }
  return { valid: true };
}

// ─── Quick-action chip presets ────────────────────────────────────────────────

export const QUICK_EDIT_PRESETS: Record<string, FullVideoEditOptions> = {
  trim:       { startTrim: 0 },
  cinematic:  { contrast: 25, saturation: -10, vignette: true, fadeIn: true, fadeOut: true },
  slowmo:     { speed: 0.5 },
  bw:         { grayscale: true },
  reel:       { aspectRatio: '9:16', fadeIn: true, fadeOut: true },
  enhance:    { brightness: 10, contrast: 20, saturation: 15, sharpen: true, vignette: true },
  vintage:    { sepia: true, filmGrain: true, contrast: 15 },
  hdr:        { contrast: 35, saturation: 25, sharpen: true },
};
