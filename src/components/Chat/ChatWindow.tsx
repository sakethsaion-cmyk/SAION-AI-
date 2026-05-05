import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Menu,
  Download,
  Square,
  Film,
  Sliders,
  Type,
  Zap,
  Scissors,
  RotateCcw,
  Sun,
  Contrast,
  Droplets,
  Wind,
  Eye,
  Clock,
  FlipHorizontal,
  FlipVertical,
  Volume2,
  Layers,
  Sparkles,
  Check,
  X,
  Upload,
  Music,
  AlertCircle,
} from "lucide-react";
import { useChat } from "../../contexts/ChatContext";
import { useAuth } from "../../contexts/AuthContext";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import SaionLogo from "../UI/SaionLogo";
import {
  sendMessage,
  detectIntent,
  generateWebsite,
  deployWebsiteToNetlify,
  generateVSCodeProject,
  generateChatTitle,
  stopCurrentResponse,
  generateImageWithFlux,
} from "../../services/aiService";
import { launchAndroidApp } from "../../services/mediaService";
import { incrementMessageCount } from "../../services/dbService";
import {
  processVideo,
  extractVideoThumbnail,
  parseEditRequest,
  describeEdits,
  detectVideoIntent,
  validateAudioFile,
  QUICK_EDIT_PRESETS,
  FullVideoEditOptions,
  AudioEditOptions,
  triggerDownload,
} from "../../services/videoService";
import { Message, Attachment } from "../../types";

// ─── Image helper (fal.ai Flux.1-Schnell) ────────────────────────────────────
// generateImageWithFlux is imported from aiService below

// ─── Video Feature catalogue ─────────────────────────────────────────────────
interface VideoFeature {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  description: string;
}

const VIDEO_FEATURES: VideoFeature[] = [
  {
    id: "enhance",
    label: "Auto Enhance",
    icon: <Sparkles size={14} />,
    category: "Presets",
    description: "Brightness + Contrast + Sharpen",
  },
  {
    id: "cinematic",
    label: "Cinematic Look",
    icon: <Film size={14} />,
    category: "Presets",
    description: "Hollywood colour grade + vignette",
  },
  {
    id: "fadeBoth",
    label: "Fade In & Out",
    icon: <Layers size={14} />,
    category: "Presets",
    description: "Smooth fades at start and end",
  },
  {
    id: "hdr",
    label: "HDR Effect",
    icon: <Zap size={14} />,
    category: "Presets",
    description: "High dynamic range boost",
  },
  {
    id: "vintage",
    label: "Vintage Film",
    icon: <Film size={14} />,
    category: "Presets",
    description: "Sepia + grain + warmth",
  },
  {
    id: "brightness",
    label: "Brightness",
    icon: <Sun size={14} />,
    category: "Color & Tone",
    description: "Lighten or darken the video",
  },
  {
    id: "contrast",
    label: "Contrast",
    icon: <Contrast size={14} />,
    category: "Color & Tone",
    description: "Distinct light/dark regions",
  },
  {
    id: "saturation",
    label: "Saturation",
    icon: <Droplets size={14} />,
    category: "Color & Tone",
    description: "Boost or reduce colour intensity",
  },
  {
    id: "warmth",
    label: "Warm Tone",
    icon: <Sparkles size={14} />,
    category: "Color & Tone",
    description: "Golden / warm colour shift",
  },
  {
    id: "cool",
    label: "Cool Tone",
    icon: <Sparkles size={14} />,
    category: "Color & Tone",
    description: "Blue / cool colour shift",
  },
  {
    id: "grayscale",
    label: "Black & White",
    icon: <Eye size={14} />,
    category: "Color & Tone",
    description: "Classic monochrome",
  },
  {
    id: "sepia",
    label: "Sepia / Vintage",
    icon: <Film size={14} />,
    category: "Color & Tone",
    description: "Vintage brown film tone",
  },
  {
    id: "vignette",
    label: "Vignette",
    icon: <Eye size={14} />,
    category: "Effects",
    description: "Dark edges — cinematic depth",
  },
  {
    id: "filmGrain",
    label: "Film Grain",
    icon: <Wind size={14} />,
    category: "Effects",
    description: "Realistic film grain texture",
  },
  {
    id: "blur",
    label: "Blur / Soft Focus",
    icon: <Wind size={14} />,
    category: "Effects",
    description: "Dreamy soft blur",
  },
  {
    id: "sharpen",
    label: "Sharpen",
    icon: <Zap size={14} />,
    category: "Effects",
    description: "Crisp edge enhancement",
  },
  {
    id: "slowmo",
    label: "Slow Motion (0.5x)",
    icon: <Clock size={14} />,
    category: "Speed & Time",
    description: "Half-speed slow motion",
  },
  {
    id: "speedup",
    label: "Speed Up (2x)",
    icon: <Clock size={14} />,
    category: "Speed & Time",
    description: "Double playback speed",
  },
  {
    id: "speedup4",
    label: "Speed Up (4x)",
    icon: <Clock size={14} />,
    category: "Speed & Time",
    description: "Quadruple playback speed",
  },
  {
    id: "reverse",
    label: "Reverse Video",
    icon: <RotateCcw size={14} />,
    category: "Speed & Time",
    description: "Play video backwards",
  },
  {
    id: "flipHorizontal",
    label: "Mirror / Flip H",
    icon: <FlipHorizontal size={14} />,
    category: "Transform",
    description: "Flip left-to-right (mirror)",
  },
  {
    id: "flipVertical",
    label: "Flip Vertical",
    icon: <FlipVertical size={14} />,
    category: "Transform",
    description: "Flip upside-down",
  },
  {
    id: "rotate90",
    label: "Rotate 90°",
    icon: <RotateCcw size={14} />,
    category: "Transform",
    description: "Portrait → landscape",
  },
  {
    id: "rotate180",
    label: "Rotate 180°",
    icon: <RotateCcw size={14} />,
    category: "Transform",
    description: "Flip upside down",
  },
  {
    id: "reel",
    label: "Reels / 9:16",
    icon: <Film size={14} />,
    category: "Transform",
    description: "Crop to vertical 9:16",
  },
  {
    id: "square",
    label: "Square / 1:1",
    icon: <Film size={14} />,
    category: "Transform",
    description: "Crop to 1:1 square",
  },
  {
    id: "fadeIn",
    label: "Fade In",
    icon: <Layers size={14} />,
    category: "Transitions",
    description: "Fade from black at start",
  },
  {
    id: "fadeOut",
    label: "Fade Out",
    icon: <Layers size={14} />,
    category: "Transitions",
    description: "Fade to black at end",
  },
  {
    id: "slideLeft",
    label: "Slide Left",
    icon: <Layers size={14} />,
    category: "Transitions",
    description: "Slide-in from left",
  },
  {
    id: "slideRight",
    label: "Slide Right",
    icon: <Layers size={14} />,
    category: "Transitions",
    description: "Slide-in from right",
  },
  {
    id: "zoomIn",
    label: "Zoom In",
    icon: <Zap size={14} />,
    category: "Transitions",
    description: "Scale up at start",
  },
  {
    id: "blurTrans",
    label: "Blur Transition",
    icon: <Wind size={14} />,
    category: "Transitions",
    description: "Blur-in at start",
  },
  {
    id: "textTop",
    label: "Text — Top",
    icon: <Type size={14} />,
    category: "Text Overlay",
    description: "Text at top of video",
  },
  {
    id: "textCenter",
    label: "Text — Center",
    icon: <Type size={14} />,
    category: "Text Overlay",
    description: "Centered text overlay",
  },
  {
    id: "textBottom",
    label: "Text — Bottom",
    icon: <Type size={14} />,
    category: "Text Overlay",
    description: "Subtitle-style bottom text",
  },
  {
    id: "mute",
    label: "Mute Audio",
    icon: <Volume2 size={14} />,
    category: "Audio",
    description: "Remove all audio",
  },
  {
    id: "keepAudio",
    label: "Keep Audio",
    icon: <Volume2 size={14} />,
    category: "Audio",
    description: "Keep original audio",
  },
  {
    id: "replaceAudio",
    label: "Replace Audio",
    icon: <Music size={14} />,
    category: "Audio",
    description: "Upload MP3/WAV to replace",
  },
  {
    id: "trim",
    label: "Trim / Cut",
    icon: <Scissors size={14} />,
    category: "Cut & Crop",
    description: "Set start/end in seconds",
  },
];

const FEATURE_CATEGORIES = [
  "Presets",
  "Color & Tone",
  "Effects",
  "Speed & Time",
  "Transform",
  "Transitions",
  "Text Overlay",
  "Audio",
  "Cut & Crop",
];

// ─── Build FullVideoEditOptions from selected feature IDs ─────────────────────
function buildEditOptions(
  features: string[],
  textContent: string,
  trimStart: number,
  trimEnd: number,
  audioFile: File | null,
  customInstructions: string,
): FullVideoEditOptions {
  const opts: FullVideoEditOptions = {};

  if (features.includes("brightness")) opts.brightness = 30;
  if (features.includes("contrast")) opts.contrast = 40;
  if (features.includes("saturation")) opts.saturation = 50;
  if (features.includes("warmth")) opts.warmth = 40;
  if (features.includes("cool")) opts.warmth = -40;
  if (features.includes("grayscale")) opts.grayscale = true;
  if (features.includes("sepia")) opts.sepia = true;
  if (features.includes("vignette")) opts.vignette = true;
  if (features.includes("filmGrain")) opts.filmGrain = true;
  if (features.includes("blur")) opts.blur = 4;
  if (features.includes("sharpen")) opts.sharpen = true;
  if (features.includes("slowmo")) opts.speed = 0.5;
  if (features.includes("speedup")) opts.speed = 2;
  if (features.includes("speedup4")) opts.speed = 4;
  if (features.includes("reverse")) opts.reverse = true;
  if (features.includes("flipHorizontal")) opts.flipHorizontal = true;
  if (features.includes("flipVertical")) opts.flipVertical = true;
  if (features.includes("rotate90")) opts.rotation = 90;
  if (features.includes("rotate180")) opts.rotation = 180;
  if (features.includes("fadeIn")) opts.fadeIn = true;
  if (features.includes("fadeOut")) opts.fadeOut = true;
  if (features.includes("fadeBoth")) {
    opts.fadeIn = true;
    opts.fadeOut = true;
  }
  if (features.includes("slideLeft")) opts.transition = { type: "slideLeft" };
  if (features.includes("slideRight")) opts.transition = { type: "slideRight" };
  if (features.includes("zoomIn")) opts.transition = { type: "zoomIn" };
  if (features.includes("blurTrans"))
    opts.transition = { type: "blurTransition" };
  if (features.includes("reel")) opts.aspectRatio = "9:16";
  if (features.includes("square")) opts.aspectRatio = "1:1";
  if (features.includes("hdr")) {
    opts.contrast = 35;
    opts.saturation = 25;
    opts.sharpen = true;
  }
  if (features.includes("vintage")) {
    opts.sepia = true;
    opts.filmGrain = true;
    opts.contrast = 15;
  }
  if (features.includes("cinematic")) {
    opts.contrast = 25;
    opts.saturation = -10;
    opts.vignette = true;
  }
  if (features.includes("enhance")) {
    opts.brightness = 10;
    opts.contrast = 20;
    opts.saturation = 15;
    opts.sharpen = true;
    opts.vignette = true;
  }

  // Text
  const textPos = features.includes("textTop")
    ? "top"
    : features.includes("textCenter")
      ? "center"
      : features.includes("textBottom")
        ? "bottom"
        : null;
  if (textPos) {
    opts.addText = textContent.trim() || "SAION AI";
    opts.textPosition = textPos;
    opts.textColor = "#ffffff";
    opts.fontSize = 36;
  }

  // Trim
  if (features.includes("trim")) {
    if (trimStart > 0) opts.startTrim = trimStart;
    if (trimEnd > 0) opts.endTrim = trimEnd;
  }

  // Audio
  if (features.includes("mute")) opts.mute = true;
  if (features.includes("replaceAudio") && audioFile) {
    opts.audio = { action: "replace", replacementFile: audioFile };
  }

  // Parse custom instructions (extends/overrides)
  if (customInstructions.trim()) {
    const parsed = parseEditRequest(customInstructions);
    Object.assign(opts, parsed);
  }

  return opts;
}

// ─── AI Quick-action chips ────────────────────────────────────────────────────
const AI_CHIPS = [
  { label: "✂️ Trim", msg: "trim" },
  { label: "🎨 Effects", msg: "effects" },
  { label: "🎤 Captions", msg: "captions" },
  { label: "⚡ Speed", msg: "speed" },
  { label: "🎬 Make reel", msg: "reel" },
];

// ─── Audio chip options ───────────────────────────────────────────────────────
const AUDIO_CHIPS = [
  { label: "🔇 Mute", action: "mute" as const },
  { label: "🎵 Keep audio", action: "keep" as const },
  { label: "🔄 Replace", action: "replace" as const },
  { label: "🎚 Adjust vol", action: "adjustVolume" as const },
];

// ─── Video Editor Modal ───────────────────────────────────────────────────────
interface VideoEditorModalProps {
  videoFile: File;
  thumbnail: string;
  videoDuration: number;
  onConfirm: (
    features: string[],
    textContent: string,
    trimStart: number,
    trimEnd: number,
    audioFile: File | null,
    customInstructions: string,
  ) => void;
  onCancel: () => void;
}

function VideoEditorModal({
  videoFile,
  thumbnail,
  videoDuration,
  onConfirm,
  onCancel,
}: VideoEditorModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("Presets");
  const [textContent, setTextContent] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(Math.round(videoDuration));
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState("");
  const audioInputRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const needsText =
    selected.has("textTop") ||
    selected.has("textCenter") ||
    selected.has("textBottom");
  const needsTrim = selected.has("trim");
  const needsAudio = selected.has("replaceAudio");
  const categoryFeatures = VIDEO_FEATURES.filter(
    (f) => f.category === activeCategory,
  );

  const handleAudioFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const result = validateAudioFile(f);
    if (!result.valid) {
      setAudioError(result.error || "Invalid audio file");
      return;
    }
    setAudioFile(f);
    setAudioError("");
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center">
              <Film size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">
                AI Video Editor
              </h2>
              <p className="text-gray-500 text-[11px] truncate max-w-[280px]">
                {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)}{" "}
                MB · {Math.round(videoDuration)}s
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-white transition-colors p-1"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left — thumbnail + categories */}
          <div className="w-44 shrink-0 border-r border-[#1a1a1a] flex flex-col">
            <div className="p-3 border-b border-[#1a1a1a]">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="preview"
                  className="w-full rounded-xl object-cover h-[76px]"
                />
              ) : (
                <div className="w-full rounded-xl bg-[#111] flex items-center justify-center h-[76px]">
                  <Film size={20} className="text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {FEATURE_CATEGORIES.map((cat) => {
                const count = Array.from(selected).filter(
                  (id) =>
                    VIDEO_FEATURES.find((f) => f.id === id)?.category === cat,
                ).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 text-xs transition-all flex items-center justify-between ${
                      activeCategory === cat
                        ? "text-white bg-violet-600/20 border-r-2 border-violet-500"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{cat}</span>
                    {count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — features + extra inputs */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-gray-600 text-[11px] mb-3">
                Select edits to apply. Pick multiple options.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categoryFeatures.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      selected.has(f.id)
                        ? "border-violet-500 bg-violet-600/15 text-white"
                        : "border-[#1e1e1e] bg-[#0e0e0e] text-gray-400 hover:border-[#2a2a2a] hover:text-gray-200"
                    }`}
                  >
                    <div
                      className={`mt-0.5 shrink-0 ${selected.has(f.id) ? "text-violet-400" : "text-gray-600"}`}
                    >
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">{f.label}</span>
                        {selected.has(f.id) && (
                          <Check
                            size={10}
                            className="text-violet-400 shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">
                        {f.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Text input */}
              {needsText && (
                <div className="mt-3 p-3 rounded-xl border border-violet-500/30 bg-violet-600/5">
                  <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <Type size={11} className="text-violet-400" /> Text to
                    overlay:
                  </label>
                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder='e.g. "My Vlog 2024" or "SAION AI"'
                    className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-600/50"
                    maxLength={80}
                  />
                </div>
              )}

              {/* Trim input */}
              {needsTrim && (
                <div className="mt-3 p-3 rounded-xl border border-violet-500/30 bg-violet-600/5">
                  <label className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                    <Scissors size={11} className="text-violet-400" /> Trim
                    range (seconds):
                  </label>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-600 mb-1">Start</p>
                      <input
                        type="number"
                        min={0}
                        max={videoDuration - 1}
                        step={0.5}
                        value={trimStart}
                        onChange={(e) =>
                          setTrimStart(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-600/50"
                        placeholder="0"
                      />
                    </div>
                    <span className="text-gray-600 text-xs mt-4">→</span>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-600 mb-1">
                        End (max {Math.round(videoDuration)}s)
                      </p>
                      <input
                        type="number"
                        min={1}
                        max={videoDuration}
                        step={0.5}
                        value={trimEnd}
                        onChange={(e) =>
                          setTrimEnd(
                            parseFloat(e.target.value) || videoDuration,
                          )
                        }
                        className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-600/50"
                        placeholder="End time"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Audio replacement upload */}
              {needsAudio && (
                <div className="mt-3 p-3 rounded-xl border border-violet-500/30 bg-violet-600/5">
                  <label className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                    <Music size={11} className="text-violet-400" /> Upload audio
                    file (MP3 / WAV):
                  </label>
                  {audioFile ? (
                    <div className="flex items-center gap-2 bg-[#111] rounded-lg px-3 py-2 border border-[#1e1e1e]">
                      <Music size={13} className="text-violet-400 shrink-0" />
                      <span className="text-white text-xs truncate flex-1">
                        {audioFile.name}
                      </span>
                      <button
                        onClick={() => setAudioFile(null)}
                        className="text-gray-600 hover:text-red-400"
                        title="Remove audio"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#2a2a2a] rounded-lg text-xs text-gray-500 hover:border-violet-500/50 hover:text-violet-400 transition-all"
                    >
                      <Upload size={13} /> Choose MP3 or WAV file
                    </button>
                  )}
                  {audioError && (
                    <div className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5">
                      <AlertCircle size={11} /> {audioError}
                    </div>
                  )}
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/mp3,audio/ogg,audio/aac,.mp3,.wav,.ogg,.aac,.m4a"
                    className="hidden"
                    onChange={(e) => handleAudioFile(e.target.files)}
                    title="Select audio file"
                  />
                </div>
              )}

              {/* Custom instructions */}
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Extra instructions (optional):
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder='e.g. "make it look cinematic and dramatic"'
                  rows={2}
                  className="w-full bg-[#0e0e0e] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-600/40 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-3 border-t border-[#1a1a1a] flex items-center justify-between gap-3 bg-[#080808]">
              <div className="text-xs text-gray-500">
                {selected.size > 0 ? (
                  <span className="text-violet-400 font-medium">
                    {selected.size} edit{selected.size !== 1 ? "s" : ""}{" "}
                    selected
                  </span>
                ) : (
                  <span>Pick edits from the left categories</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-xs text-gray-500 hover:text-white border border-[#1e1e1e] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selected.size === 0 && !customInstructions.trim())
                      return;
                    onConfirm(
                      Array.from(selected),
                      textContent,
                      trimStart,
                      trimEnd,
                      audioFile,
                      customInstructions,
                    );
                  }}
                  disabled={selected.size === 0 && !customInstructions.trim()}
                  className="px-4 py-2 text-xs text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-[0_0_12px_rgba(124,58,237,0.3)]"
                >
                  <Sliders size={12} /> Apply & Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI prompt chips shown right after video upload ───────────────────────────
function AiChips({ onChip }: { onChip: (msg: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {AI_CHIPS.map((c) => (
        <button
          key={c.label}
          onClick={() => onChip(c.msg)}
          className="px-3 py-1.5 rounded-full bg-[#111] border border-[#1e1e1e] text-xs text-gray-300 hover:border-violet-500/60 hover:text-violet-300 transition-all"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ─── Audio prompt chips ───────────────────────────────────────────────────────
function AudioChips({
  onChip,
}: {
  onChip: (action: AudioEditOptions["action"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {AUDIO_CHIPS.map((c) => (
        <button
          key={c.label}
          onClick={() => onChip(c.action)}
          className="px-3 py-1.5 rounded-full bg-[#111] border border-[#1e1e1e] text-xs text-gray-300 hover:border-violet-500/60 hover:text-violet-300 transition-all"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main ChatWindow ──────────────────────────────────────────────────────────
export default function ChatWindow() {
  const {
    activeConversation,
    sidebarOpen,
    setSidebarOpen,
    personality,
    isSending,
    setIsSending,
    addMessage,
    updateLastMessage,
    createNewConversation,
    updateConversationTitle,
  } = useChat();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Video editor state
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [pendingVideoThumb, setPendingVideoThumb] = useState("");
  const [pendingVideoDur, setPendingVideoDur] = useState(0);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [videoEditProgress, setVideoEditProgress] = useState("");
  // AI interaction state after upload
  const [awaitingVideoCmd, setAwaitingVideoCmd] = useState(false);
  const [awaitingAudioCmd, setAwaitingAudioCmd] = useState(false);
  const [pendingAudioAction, setPendingAudioAction] =
    useState<AudioEditOptions | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  useEffect(() => {
    if (
      userProfile &&
      !userProfile.isPaid &&
      (userProfile.dailyMessageCount || 0) >= 200
    ) {
      setLimitReached(true);
    } else {
      setLimitReached(false);
    }
  }, [userProfile]);

  const handleStop = () => {
    stopCurrentResponse();
    setIsSending(false);
    setIsStreaming(false);
  };

  // ── Video editor confirmed ────────────────────────────────────────────────
  const handleVideoEditorConfirm = useCallback(
    async (
      features: string[],
      textContent: string,
      trimStart: number,
      trimEnd: number,
      audioFile: File | null,
      customInstructions: string,
    ) => {
      if (!pendingVideoFile) return;
      setShowVideoEditor(false);
      setAwaitingVideoCmd(false);
      setAwaitingAudioCmd(false);

      const featureLabels = features
        .map((id) => VIDEO_FEATURES.find((f) => f.id === id)?.label || id)
        .filter(Boolean)
        .join(", ");

      const editSummary = [
        featureLabels && `**Edits:** ${featureLabels}`,
        textContent && `**Text overlay:** "${textContent}"`,
        customInstructions && `**Custom:** ${customInstructions}`,
      ]
        .filter(Boolean)
        .join("\n");

      await addMessage({
        role: "assistant",
        content: `🎬 Starting edit!\n${editSummary}\n\n⏳ Processing — this may take a moment for longer videos...`,
      });

      setVideoEditProgress("Initialising…");

      try {
        const opts = buildEditOptions(
          features,
          textContent,
          trimStart,
          trimEnd,
          audioFile,
          customInstructions,
        );
        if (pendingAudioAction)
          Object.assign(
            opts,
            pendingAudioAction.action === "mute" ? { mute: true } : {},
          );

        const { blob, objectUrl } = await processVideo(
          pendingVideoFile,
          opts,
          ({ stage, percent }) => setVideoEditProgress(`${stage} ${percent}%`),
          true, // try ffmpeg first, canvas fallback
        );

        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const outputName =
          pendingVideoFile.name.replace(/\.[^.]+$/, "") +
          `-saion-edited.${ext}`;

        setVideoEditProgress("");
        await addMessage({
          role: "assistant",
          content: `✅ **Video editing complete!** Your edited video is ready to preview and download.\n\nEdits applied: ${featureLabels || customInstructions || "Custom"}`,
          type: "video",
          metadata: {
            videoUrl: objectUrl,
            videoName: outputName,
            videoEditSummary: featureLabels,
          },
        });

        // Also auto-ask about audio if it wasn't handled
        if (!opts.mute && !opts.audio) {
          await addMessage({
            role: "assistant",
            content: "🎧 **What would you like to do with the audio?**",
          });
          setAwaitingAudioCmd(true);
        }
      } catch (err) {
        setVideoEditProgress("");
        await addMessage({
          role: "assistant",
          content: `⚠️ Edit failed: ${err instanceof Error ? err.message : "Processing error"}.\n\nTip: Try a shorter video (under 2 min works best). Video remains unchanged.`,
        });
      }

      setPendingVideoFile(null);
      setPendingVideoThumb("");
      setPendingVideoDur(0);
      setPendingAudioAction(null);
      setIsSending(false);
      await refreshProfile();
    },
    [
      pendingVideoFile,
      pendingAudioAction,
      addMessage,
      setIsSending,
      refreshProfile,
    ],
  );

  const handleVideoEditorCancel = useCallback(() => {
    setShowVideoEditor(false);
    setAwaitingVideoCmd(false);
    setPendingVideoFile(null);
    setPendingVideoThumb("");
    setPendingVideoDur(0);
    setIsSending(false);
  }, [setIsSending]);

  // ── Audio chip handler ────────────────────────────────────────────────────
  const handleAudioChip = useCallback(
    async (action: AudioEditOptions["action"]) => {
      setAwaitingAudioCmd(false);
      if (action === "replace") {
        await addMessage({
          role: "assistant",
          content:
            "📁 **Please upload an audio file (MP3 or WAV)** so I can replace the audio.\n\nClick the 📎 attach button below and choose your audio file.",
        });
      } else if (action === "mute") {
        await addMessage({
          role: "assistant",
          content: "🔇 Audio will be muted on your next edit.",
        });
        setPendingAudioAction({ action: "mute" });
      } else if (action === "keep") {
        await addMessage({
          role: "assistant",
          content: "✅ Keeping the original audio.",
        });
        setPendingAudioAction({ action: "keep" });
      } else if (action === "adjustVolume") {
        await addMessage({
          role: "assistant",
          content:
            '🎚 Sure! Type the volume level you want (e.g. "0.5" for 50%, "1.5" for 150%).',
        });
        setPendingAudioAction({ action: "adjustVolume", volume: 1.0 });
      }
    },
    [addMessage],
  );

  // ── Main send handler ─────────────────────────────────────────────────────
  const handleSend = async (text: string, attachments?: Attachment[]) => {
    if (!currentUser || isSending) return;
    if (!text.trim() && (!attachments || attachments.length === 0)) return;

    const { allowed } = await incrementMessageCount(currentUser.uid);
    if (!allowed) {
      setLimitReached(true);
      return;
    }

    setIsSending(true);
    setIsStreaming(false);

    const intent = detectIntent(text);
    if (!activeConversation) await createNewConversation();

    await addMessage({ role: "user", content: text, attachments });

    const isFirstMsg = (activeConversation?.messages.length || 0) === 0;
    if (isFirstMsg && activeConversation) {
      generateChatTitle(text).then((title) =>
        updateConversationTitle(activeConversation.id, title),
      );
    }

    try {
      // ── Video attachment ────────────────────────────────────────────────
      const videoAttachment = attachments?.find(
        (a) =>
          a.mimeType?.startsWith("video/") ||
          a.name.match(/\.(mp4|webm|mov|avi|mkv|m4v|3gp)$/i),
      );

      if (videoAttachment) {
        const fetchRes = await fetch(videoAttachment.url);
        const blob = await fetchRes.blob();
        const file = new File([blob], videoAttachment.name, {
          type: blob.type || "video/mp4",
        });

        const thumb = await extractVideoThumbnail(file);
        const dur = await getVideoDuration(file);

        setPendingVideoFile(file);
        setPendingVideoThumb(thumb);
        setPendingVideoDur(dur);

        // AI instantly responds with edit prompt + chips
        await addMessage({
          role: "assistant",
          content: `🎬 **"${videoAttachment.name}"** uploaded (${(file.size / 1024 / 1024).toFixed(1)} MB · ${Math.round(dur)}s)\n\n**What would you like me to edit?**`,
          type: "text",
        });
        setAwaitingVideoCmd(true);
        setIsSending(false);
        return;
      }

      // ── AI quick-action when awaiting video command ─────────────────────
      if (awaitingVideoCmd && pendingVideoFile) {
        const vidIntent = detectVideoIntent(text);
        const chips = ["trim", "effects", "captions", "speed", "reel", "audio"];

        if (chips.includes(vidIntent.type)) {
          // map chip type to feature ID then open modal with that category pre-selected
          const catMap: Record<string, string> = {
            trim: "Cut & Crop",
            effects: "Effects",
            captions: "Text Overlay",
            speed: "Speed & Time",
            reel: "Transform",
            audio: "Audio",
          };
          await addMessage({
            role: "assistant",
            content: `👍 Opening the editor for **${text}** — choose your settings below.`,
          });
          setAwaitingVideoCmd(false);
          setShowVideoEditor(true);
          setIsSending(false);
          return;
        }

        // Free-text command on video
        setAwaitingVideoCmd(false);
        const parsed = parseEditRequest(text);
        const description = describeEdits(parsed);

        await addMessage({
          role: "assistant",
          content: `🎬 Starting video edit!\n**Edits:** ${description.join(", ")}\n\n⏳ Processing…`,
        });
        setVideoEditProgress("Initialising…");

        const { blob, objectUrl } = await processVideo(
          pendingVideoFile,
          parsed,
          ({ stage, percent }) => setVideoEditProgress(`${stage} ${percent}%`),
          true,
        );
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const outputName =
          pendingVideoFile.name.replace(/\.[^.]+$/, "") +
          `-saion-edited.${ext}`;
        setVideoEditProgress("");

        await addMessage({
          role: "assistant",
          content: `✅ **Done!** Edits applied: ${description.join(", ")}`,
          type: "video",
          metadata: {
            videoUrl: objectUrl,
            videoName: outputName,
            videoEditSummary: description.join(", "),
          },
        });
        setPendingVideoFile(null);
        setPendingVideoThumb("");
        setPendingVideoDur(0);
        setIsSending(false);
        await refreshProfile();
        return;
      }

      // ── Audio chip was 'adjust volume' — parse volume from next message ─
      if (
        awaitingAudioCmd === false &&
        pendingAudioAction?.action === "adjustVolume"
      ) {
        const vol = parseFloat(text);
        if (!isNaN(vol)) {
          setPendingAudioAction({
            action: "adjustVolume",
            volume: Math.max(0, Math.min(2, vol)),
          });
          await addMessage({
            role: "assistant",
            content: `✅ Volume set to **${vol}x**. It will apply on your next edit.`,
          });
          setIsSending(false);
          return;
        }
      }

      // ── Audio file upload for replace ───────────────────────────────────
      const audioAttachment = attachments?.find(
        (a) =>
          a.mimeType?.startsWith("audio/") ||
          a.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i),
      );
      if (audioAttachment) {
        const fetchRes = await fetch(audioAttachment.url);
        const blob = await fetchRes.blob();
        const audioFile = new File([blob], audioAttachment.name, {
          type: blob.type || "audio/mpeg",
        });
        const validation = validateAudioFile(audioFile);
        if (!validation.valid) {
          await addMessage({
            role: "assistant",
            content: `❌ ${validation.error}`,
          });
          setIsSending(false);
          return;
        }
        setPendingAudioAction({
          action: "replace",
          replacementFile: audioFile,
        });
        await addMessage({
          role: "assistant",
          content: `🎵 **"${audioAttachment.name}"** ready. Upload a video and I'll replace its audio with this file!`,
        });
        setIsSending(false);
        return;
      }

      // ── Image generation (fal.ai Flux.1-Schnell) ────────────────────────
      if (intent.type === "image") {
        const prompt = intent.query || text;
        const loadingMsgId = await addMessage({
          role: "assistant",
          content: `🎨 Generating image with **Flux.1-Schnell**… this takes ~5 seconds ✨`,
          type: "text",
        });
        try {
          const imageUrl = await generateImageWithFlux(prompt);
          // Remove loading message, add real image
          await addMessage({
            role: "assistant",
            content: `🎨 Here's your generated image for **"${prompt}"**:`,
            type: "image",
            metadata: { imageUrl, imageCaption: prompt },
          });
        } catch (err) {
          await addMessage({
            role: "assistant",
            content: `❌ Image generation failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
            type: "text",
          });
        }
        setIsSending(false);
        await refreshProfile();
        return;
      }

      // ── Website builder ─────────────────────────────────────────────────
      if (intent.type === "website") {
        // Website costs 5 messages
        await addMessage({
          role: "assistant",
          content: "🌐 Building your website… *(this uses 5 messages)*",
        });
        const html = await generateWebsite(text);
        if (html && html.includes("<")) {
          // Show website preview first
          await addMessage({
            role: "assistant",
            content: "✅ Website built! Now deploying it live for you… 🚀",
            type: "website",
            metadata: { websiteHtml: html },
          });
          // Auto-deploy to Netlify
          await addMessage({
            role: "assistant",
            content: "⏳ Deploying your website to a live URL… please wait ~10 seconds",
          });
          const siteName = text.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '-');
          const deployed = await deployWebsiteToNetlify(html, siteName);
          if (deployed.url && !deployed.error) {
            const expiry = deployed.expiresAt
              ? new Date(deployed.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
              : '2 months';
            await addMessage({
              role: "assistant",
              content: `🎉 **Your website is live!**\n\n🔗 **URL:** [${deployed.url}](${deployed.url})\n\n⏰ **Active until:** ${expiry} *(Free plan — 2 months)*\n\n✨ **Upgrade to Pro** to keep your website live for **5 years** and I\'ll make sure it stays active!\n\n> 💡 This website used **5 messages** from your daily limit.`,
              metadata: {
                websiteHtml: html,
                deployedUrl: deployed.url,
                deployedExpiresAt: deployed.expiresAt,
              },
            });
          } else {
            await addMessage({
              role: "assistant",
              content: `⚠️ Auto-deploy is not available right now (backend not running). But your website is ready — click **Export** below to download it and deploy manually on [netlify.com/drop](https://netlify.com/drop).\n\n> 💡 This website used **5 messages** from your daily limit.`,
            });
          }
        } else {
          await addMessage({
            role: "assistant",
            content: "⚠️ Could not generate website. Describe it in more detail.",
          });
        }
        setIsSending(false);
        await refreshProfile();
        return;
      }

      // ── App launcher ────────────────────────────────────────────────────
      if (intent.type === "app") {
        const appQuery = intent.query || text;
        await addMessage({
          role: "assistant",
          content: `🔍 Checking for **${appQuery}** on your device…`,
        });
        const result = await launchAndroidApp(appQuery);
        await addMessage({ role: "assistant", content: result.message });
        setIsSending(false);
        await refreshProfile();
        return;
      }

      // ── VS Code Project Generator ──────────────────────────────────────
      if (intent.type === "project") {
        await addMessage({
          role: "assistant",
          content: "⚙️ Building your complete VS Code project… this may take ~15 seconds ✨",
        });
        const project = await generateVSCodeProject(text);
        if (project.files.length > 0) {
          await addMessage({
            role: "assistant",
            content: `✅ Your **${project.projectName}** project is ready!\n\n**Tech Stack:** ${project.techStack}\n\n**Setup:**\n\`\`\`bash\n${project.setup}\n\`\`\`\n\nClick **Download ZIP** to get the full project folder. Extract it, run the setup commands and open in VS Code! 🚀`,
            type: "project",
            metadata: {
              projectName: project.projectName,
              projectStructure: project.structure,
              projectFiles: project.files,
              projectSetup: project.setup,
              projectTechStack: project.techStack,
            },
          });
        } else {
          await addMessage({
            role: "assistant",
            content: "⚠️ Could not generate project. Please describe it in more detail.",
          });
        }
        setIsSending(false);
        await refreshProfile();
        return;
      }

      // ── Normal AI streaming ─────────────────────────────────────────────
      setIsStreaming(true);
      await addMessage({ role: "assistant", content: "▋" });

      const contextMessages: Message[] = [
        ...(activeConversation?.messages || []).filter(
          (m) => m.content && m.content !== "▋",
        ),
        { id: "tmp-user", role: "user", content: text, timestamp: new Date() },
      ];

      let fullContent = "";
      await sendMessage(contextMessages, personality, ({ content, done }) => {
        if (content) {
          fullContent += content;
          if (activeConversation?.id)
            updateLastMessage(activeConversation.id, "", fullContent);
        }
        if (done) {
          setIsStreaming(false);
          if (activeConversation?.id) {
            updateLastMessage(
              activeConversation.id,
              "",
              fullContent || "Sorry, could not generate a response.",
            );
          }
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      await addMessage({ role: "assistant", content: `⚠️ ${msg}` });
      setIsStreaming(false);
    }

    setIsSending(false);
    await refreshProfile();
  };

  const exportChat = () => {
    if (!activeConversation) return;
    const content = activeConversation.messages
      .map(
        (m) =>
          `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleString()}\n${m.content}`,
      )
      .join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saion-chat-${activeConversation.title.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const messages = activeConversation?.messages || [];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-black">
      {/* Video Editor Modal */}
      {showVideoEditor && pendingVideoFile && (
        <VideoEditorModal
          videoFile={pendingVideoFile}
          thumbnail={pendingVideoThumb}
          videoDuration={pendingVideoDur}
          onConfirm={handleVideoEditorConfirm}
          onCancel={handleVideoEditorCancel}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#141414] bg-[#060606] shrink-0">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
              title="Open sidebar"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <SaionLogo size={28} animated />
            <div>
              <span className="font-display font-bold text-white text-sm">
                SAION AI
              </span>
              {activeConversation && (
                <p className="text-[10px] text-gray-600 truncate max-w-[200px]">
                  {activeConversation.title}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {videoEditProgress && (
            <span className="text-xs text-violet-400 animate-pulse hidden sm:block max-w-[200px] truncate">
              {videoEditProgress}
            </span>
          )}
          {isSending && (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-medium transition-all"
            >
              <Square size={11} fill="currentColor" /> Stop
            </button>
          )}
          {activeConversation && messages.length > 0 && !isSending && (
            <button
              onClick={exportChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-white hover:bg-[#111] rounded-lg text-xs transition-all"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestion={handleSend} />
          ) : (
            messages.map((msg, idx) => (
              <React.Fragment key={msg.id}>
                <MessageBubble message={msg} />
                {/* Show AI chips right after upload response */}
                {idx === messages.length - 1 &&
                  awaitingVideoCmd &&
                  msg.role === "assistant" && (
                    <div className="ml-11 mb-4">
                      <AiChips onChip={(chipMsg) => handleSend(chipMsg)} />
                    </div>
                  )}
                {/* Show audio chips when awaiting audio command */}
                {idx === messages.length - 1 &&
                  awaitingAudioCmd &&
                  msg.role === "assistant" && (
                    <div className="ml-11 mb-4">
                      <AudioChips onChip={handleAudioChip} />
                    </div>
                  )}
              </React.Fragment>
            ))
          )}

          {isSending && !isStreaming && !showVideoEditor && (
            <div className="flex gap-3 mb-4 msg-animate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(124,58,237,0.3)]">
                <SaionLogo size={20} animated={false} />
              </div>
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl rounded-bl-md px-4 py-3.5">
                {videoEditProgress ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-xs text-violet-400">
                      {videoEditProgress}
                    </span>
                  </div>
                ) : (
                  <div className="typing-dots flex gap-1.5 items-center">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Open Editor button when video is loaded but modal dismissed */}
      {pendingVideoFile && !showVideoEditor && !awaitingVideoCmd && (
        <div className="border-t border-[#1a1a1a] bg-[#080808] px-4 py-2 flex items-center gap-3">
          <Film size={13} className="text-violet-400 shrink-0" />
          <span className="text-xs text-gray-500 flex-1 truncate">
            {pendingVideoFile.name} loaded
          </span>
          <button
            onClick={() => setShowVideoEditor(true)}
            className="text-xs text-violet-400 hover:text-violet-300 border border-violet-600/30 rounded-lg px-3 py-1 transition-all"
          >
            Open Editor
          </button>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        disabled={isSending}
        limitReached={limitReached}
        onStop={handleStop}
        isSending={isSending}
      />
    </div>
  );
}

// ─── Utility: get video duration from File ────────────────────────────────────
async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration || 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.load();
  });
}

// ─── Welcome screen ───────────────────────────────────────────────────────────
function WelcomeScreen({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  const suggestions = [
    {
      icon: "🎬",
      text: "Edit my video — attach a video file to get started",
      noClick: true,
    },
    { icon: "🎨", text: "Generate an image of a futuristic city at night" },
    { icon: "🌐", text: "Build me a portfolio website" },
    { icon: "⚙️", text: "Build me a complete React todo app VS Code project" },
    { icon: "💻", text: "Write a Python web scraper" },
    { icon: "📱", text: "Open WhatsApp" },
    { icon: "🤖", text: "Explain machine learning in simple terms" },
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center animate-fade-in">
      <div className="mb-5">
        <SaionLogo size={80} animated />
      </div>
      <h2 className="font-display text-3xl font-bold text-white mb-2">
        Hello, I'm <span className="gradient-text">SAION AI</span>
      </h2>
      <p className="text-gray-500 text-sm mb-8 max-w-md leading-relaxed">
        Your advanced AI assistant by Saion Production.
        <br />
        Chat, generate images, edit videos, build websites and more.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => !s.noClick && onSuggestion(s.text)}
            className={`text-left flex items-center gap-3 px-4 py-3 bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl text-sm text-gray-400 transition-all ${
              s.noClick
                ? "opacity-70 cursor-default"
                : "hover:bg-[#151515] hover:border-violet-600/30 hover:text-gray-200 cursor-pointer"
            }`}
          >
            <span className="text-lg">{s.icon}</span>
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
