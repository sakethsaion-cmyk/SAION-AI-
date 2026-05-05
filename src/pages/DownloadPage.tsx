import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SaionLogo from "../components/UI/SaionLogo";

// ─── Feature cards ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🤖",
    title: "AI Chat",
    desc: "Talk to Qwen AI in any language — English, Hindi, Telugu and more. Smart, fast, context-aware.",
    color: "from-violet-600/20 to-violet-900/10",
    border: "border-violet-600/20",
  },
  {
    icon: "💻",
    title: "Code Generation",
    desc: "Generate, debug and explain code in any language with syntax highlighting and one-click copy.",
    color: "from-blue-600/20 to-blue-900/10",
    border: "border-blue-600/20",
  },
  {
    icon: "🎨",
    title: "Image Generation",
    desc: "Describe any image and SAION AI generates it instantly — download as PNG straight from chat.",
    color: "from-pink-600/20 to-pink-900/10",
    border: "border-pink-600/20",
  },
  {
    icon: "✂️",
    title: "Video Editing",
    desc: "Edit videos with AI — trim, add effects, text overlays, and export in one click.",
    color: "from-green-600/20 to-green-900/10",
    border: "border-green-600/20",
  },
  {
    icon: "🌐",
    title: "Website Builder",
    desc: "Describe a website and get a live HTML/CSS preview with copy and export in one click.",
    color: "from-amber-600/20 to-amber-900/10",
    border: "border-amber-600/20",
  },
  {
    icon: "🔒",
    title: "Cross-Platform",
    desc: "Private encrypted chats on Android, Windows, Linux and web. Your data stays yours only.",
    color: "from-teal-600/20 to-teal-900/10",
    border: "border-teal-600/20",
  },
  {
    icon: "📱",
    title: "App Launcher",
    desc: "Android exclusive — tell SAION AI to open any app. It checks if the app is installed first, then launches it instantly.",
    color: "from-violet-600/20 to-violet-900/10",
    border: "border-violet-600/20",
    badge: "Android Only",
  },
];

// ─── Download cards ────────────────────────────────────────────────────────
const GITHUB_BASE =
  "https://github.com/sakethsaion-cmyk/SAION-AI-/releases/download/v1.0.1";

const DOWNLOADS = [
  {
    platform: "Windows",
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
      </svg>
    ),
    ext: ".exe",
    version: "v1.0.1",
    size: "93.5 MB",
    requirement: "Windows 10 / 11 · 64-bit",
    href: `${GITHUB_BASE}/SAION-AI-Setup-v1.0.1.exe`,
    gradient: "from-blue-600 to-blue-800",
    glow: "rgba(37,99,235,0.4)",
    border: "border-blue-700/30",
    steps: [
      "Download the .exe installer",
      "Run as Administrator",
      "Follow setup wizard",
      "Launch from Desktop",
    ],
  },
  {
    platform: "Android",
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
        <path d="M17.523 15.341a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-9.046 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M2.994 8.5h18.012C21.66 8.5 22 8.84 22 9.25v9.5c0 .41-.34.75-.994.75H2.994C2.34 19.5 2 19.16 2 18.75v-9.5c0-.41.34-.75.994-.75M14.43 2.341l1.5-2.598a.25.25 0 0 0-.433-.25l-1.52 2.633A8.994 8.994 0 0 0 12 2c-.69 0-1.36.09-2.007.26L8.503.49a.25.25 0 0 0-.433.25l1.5 2.6A7.988 7.988 0 0 0 4 8.5h16a7.988 7.988 0 0 0-5.57-6.159z" />
      </svg>
    ),
    ext: ".apk",
    version: "v1.0.1",
    size: "3.51 MB",
    requirement: "Android 8.0+ (Oreo)",
    href: `${GITHUB_BASE}/app-release.apk`,
    gradient: "from-green-600 to-emerald-700",
    glow: "rgba(22,163,74,0.4)",
    border: "border-green-700/30",
    steps: [
      "Download the APK file",
      'Enable "Unknown Sources" in Settings',
      "Open APK to install",
      "Launch SAION AI",
    ],
  },
  {
    platform: "Linux",
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0 .11.135 5.313 5.313 0 0 0 2.02 1.566c.77.339 1.58.479 2.373.38.795-.1 1.53-.44 2.18-.944l.013-.012.023-.02c.453-.38.932-.644 1.457-.77.523-.124 1.087-.1 1.658.073l.02.006c.652.21 1.232.63 1.738 1.118.506.49.944 1.057 1.367 1.58.424.524.832 1.01 1.277 1.394.445.385.94.655 1.507.68.563.03 1.195-.19 1.875-.77.676-.58 1.31-1.5 1.789-2.65.48-1.15.73-2.45.718-3.74-.012-1.296-.32-2.55-.972-3.622-.65-1.074-1.6-1.956-2.828-2.46a5.31 5.31 0 0 0-1.573-.376c-.575-.047-1.173-.02-1.787.085-.308.052-.615.12-.93.193-.315.073-.634.152-.96.19-.327.038-.657.036-.988-.027-.332-.063-.664-.175-.994-.327.006-.08.015-.156.027-.235.11-.67.27-1.268.5-1.824.23-.556.524-1.07.885-1.553.361-.483.782-.933 1.26-1.368.476-.436 1.005-.858 1.578-1.29.573-.43 1.19-.87 1.82-1.36.63-.49 1.27-1.042 1.866-1.68A6.97 6.97 0 0 0 21 3.956c.26-.878.317-1.846.142-2.785C20.788.152 20.032-.36 19.172.213c-.86.572-1.39 1.62-1.702 2.742-.314 1.12-.426 2.31-.46 3.42-.016.556-.01 1.1.012 1.62a10.694 10.694 0 0 1-1.093-.765c-.487-.41-.938-.894-1.27-1.472C14.33 5.18 14.146 4.5 14.22 3.83c.073-.67.37-1.35.833-1.96.463-.61 1.09-1.15 1.844-1.545a7.267 7.267 0 0 1 .78-.352C16.937.19 16.31 0 15.66 0h-.027l-.073.002A6.48 6.48 0 0 0 14.5.1c-.384.077-.74.214-1.057.383-.318.17-.6.386-.838.633-.238.248-.432.533-.568.844-.136.31-.21.65-.208 1.002.002.35.082.712.231 1.064.298.702.827 1.365 1.453 1.89.626.526 1.346.913 2.044 1.14.697.228 1.37.297 1.95.21.58-.09 1.046-.334 1.34-.686.294-.35.418-.806.367-1.26" />
      </svg>
    ),
    ext: ".AppImage",
    version: "v1.0.1",
    size: "134 MB",
    requirement: "Ubuntu / Debian / Fedora / Arch",
    href: `${GITHUB_BASE}/SAION-AI-v1.0.1.AppImage`,
    gradient: "from-orange-600 to-amber-700",
    glow: "rgba(234,88,12,0.4)",
    border: "border-orange-700/30",
    steps: [
      "Download the AppImage",
      "chmod +x SAION-AI.AppImage",
      "Double-click or run in terminal",
      "No installation needed",
    ],
  },
  {
    platform: "Ubuntu / Debian",
    icon: (
      <svg viewBox="0 0 24 24" width="36" height="36" fill="white">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="12" cy="7" r="2" fill="white" />
        <circle cx="7.5" cy="14.5" r="2" fill="white" />
        <circle cx="16.5" cy="14.5" r="2" fill="white" />
        <line x1="12" y1="9" x2="7.5" y2="12.5" stroke="white" strokeWidth="1.5" />
        <line x1="12" y1="9" x2="16.5" y2="12.5" stroke="white" strokeWidth="1.5" />
        <line x1="7.5" y1="14.5" x2="16.5" y2="14.5" stroke="white" strokeWidth="1.5" />
      </svg>
    ),
    ext: ".deb",
    version: "v1.0.1",
    size: "80.5 MB",
    requirement: "Ubuntu 20.04+ / Debian 11+ / Linux Mint",
    href: `${GITHUB_BASE}/SAION-AI-v1.0.1.deb`,
    gradient: "from-purple-600 to-violet-700",
    glow: "rgba(124,58,237,0.4)",
    border: "border-violet-700/30",
    steps: [
      "Download the .deb package",
      "Double-click to install",
      "Or: sudo dpkg -i SAION-AI.deb",
      "Launch from app menu",
    ],
  },
];

export default function DownloadPage() {
  const navigate = useNavigate();
  const downloadRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToDownload = () => {
    downloadRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownload = (platform: string) => {
    setDownloading(platform);
    setTimeout(() => setDownloading(null), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── Warning Banner ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 w-full bg-amber-950/95 backdrop-blur-sm border-b border-amber-800/50 px-4 py-2.5 flex items-center justify-center gap-2.5">
        <span className="text-amber-400 text-lg">⚠️</span>
        <p className="text-amber-200 text-xs sm:text-sm font-medium text-center">
          This is the <strong>official SAION AI website</strong> created by
          Saion Production. Only download from trusted sources.
        </p>
      </div>

      {/* ── Background effects ────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-900/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-violet-800/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px_rgba(124,58,237,1)_1px,transparent_0)] bg-[length:40px_40px]" />
      </div>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SaionLogo size={36} animated />
          <div>
            <span className="font-display font-bold text-white text-lg tracking-wide">
              SAION AI
            </span>
            <span className="block text-[10px] text-gray-600 uppercase tracking-widest">
              by Saion Production
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Try Demo button — top right of Download page */}
          <button
            onClick={() => navigate("/try")}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-[#222] hover:border-violet-600/50 text-sm font-medium rounded-xl transition-all"
          >
            ✨ Try SAION AI Demo Chat
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-20 text-center">
        {/* Animated logo */}
        <div className="flex justify-center mb-7">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-violet-600/20 blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.5)]">
              <SaionLogo size={60} animated />
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-900/30 border border-violet-600/30 rounded-full text-violet-300 text-xs font-medium mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Now Available — v1.0.1
        </div>

        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
          SAION{" "}
          <span className="bg-gradient-to-br from-purple-400 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
            AI
          </span>
        </h1>

        <p className="text-gray-400 text-xl sm:text-2xl font-light mb-3">
          Powerful AI Assistant
        </p>
        <p className="text-gray-600 text-base max-w-xl mx-auto mb-10 leading-relaxed">
          Chat, code, generate images, play music and videos — all in one app.
          Available on Windows, Android and Linux.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={scrollToDownload}
            className="flex items-center gap-2.5 px-8 py-4 text-white font-bold text-base rounded-2xl transition-all shimmer-btn shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)] hover:scale-105"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Now
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-[#111]">
          {[
            { value: "Free", label: "to download" },
            { value: "3", label: "platforms" },
            { value: "50+", label: "languages" },
            { value: "∞", label: "AI models" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-2xl font-bold text-violet-400">
                {s.value}
              </p>
              <p className="text-gray-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Everything you need
          </h2>
          <p className="text-gray-500 text-base max-w-lg mx-auto">
            SAION AI combines powerful features into one seamless experience
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f: any, i: number) => (
            <div
              key={i}
              className={`relative bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{f.icon}</div>
                {f.badge && (
                  <span className="text-[10px] bg-violet-900/60 text-violet-300 border border-violet-600/30 px-2 py-0.5 rounded-full font-medium">
                    {f.badge}
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-1.5">
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download Section ──────────────────────────────────────── */}
      <section
        ref={downloadRef}
        className="relative z-10 max-w-6xl mx-auto px-6 py-16"
      >
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-violet-900/30 border border-violet-600/30 rounded-full text-violet-300 text-xs font-medium mb-4">
            Free Download
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            Get SAION AI
          </h2>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            Download for your platform and get started in minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {DOWNLOADS.map((d) => (
            <div
              key={d.platform}
              className={`relative bg-[#080808] border ${d.border} rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-2xl`}
            >
              {/* Card top gradient */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${d.gradient}`} />

              <div className="p-6">
                {/* Platform icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${d.gradient} flex items-center justify-center mb-5 shadow-lg`}
                >
                  {d.icon}
                </div>

                {/* Info */}
                <h3 className="font-display text-2xl font-bold text-white mb-1">
                  {d.platform}
                </h3>
                <p className="text-gray-500 text-xs mb-4">{d.requirement}</p>

                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs bg-[#111] border border-[#1e1e1e] px-2.5 py-1 rounded-full text-gray-400 font-mono">
                    {d.ext}
                  </span>
                  <span className="text-xs text-gray-600">{d.version}</span>
                  <span className="text-xs text-gray-600">{d.size}</span>
                </div>

                {/* Install steps */}
                <div className="space-y-1.5 mb-6">
                  {d.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-500"
                    >
                      <span className="shrink-0 w-4 h-4 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-[9px] font-bold text-gray-600 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>

                {/* ✅ REAL download anchor tag — triggers file download */}
                <a
                  href={d.href}
                  download
                  onClick={() => handleDownload(d.platform)}
                  className={`flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r ${d.gradient} hover:opacity-90 transition-all shadow-lg`}
                >
                  {downloading === d.platform ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download for {d.platform}
                    </>
                  )}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* System requirements note */}
        <div className="mt-8 p-5 bg-[#080808] border border-[#141414] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="text-2xl shrink-0">📋</span>
          <div>
            <p className="text-white text-sm font-medium mb-1">
              System Requirements
            </p>
            <p className="text-gray-500 text-xs leading-relaxed">
              <strong className="text-gray-400">Windows:</strong> Windows 10/11,
              64-bit, 4GB RAM minimum · &nbsp;
              <strong className="text-gray-400">Android:</strong> Android 8.0+,
              2GB RAM minimum 
              MAKE SURE YOU DOWNLOAD THE APP THROUGH CHROME NOT FROM FILES . &nbsp;
              <strong className="text-gray-400">Linux:</strong> Ubuntu 20.04+,
              Debian 11+, Fedora 35+, 4GB RAM minimum
            </p>
          </div>
        </div>
      </section>

      {/* ── Android App Launcher Feature ───────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="bg-gradient-to-br from-green-950/30 to-[#080808] border border-green-700/25 rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-5 p-7 border-b border-green-800/20">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(22,163,74,0.4)]">
              <span className="text-2xl">📱</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="font-display text-2xl font-bold text-white">
                  AI App Launcher
                </h2>
                <span className="text-xs bg-green-900/40 text-green-400 border border-green-700/40 px-3 py-1 rounded-full font-semibold">
                  🤖 Android Only
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                SAION AI can open any app on your Android device directly from
                the chat. Just say{" "}
                <span className="text-green-400 font-medium">
                  "open WhatsApp"
                </span>{" "}
                or{" "}
                <span className="text-green-400 font-medium">
                  "launch Google Assistant"
                </span>{" "}
                — the AI checks if the app is installed and opens it instantly.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-green-800/20">
            {/* Supported apps */}
            <div className="p-7">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-green-400">✓</span> Apps it can open
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["🟢", "WhatsApp"],
                  ["🔵", "Chrome"],
                  ["📧", "Gmail"],
                  ["🗺️", "Google Maps"],
                  ["▶️", "YouTube"],
                  ["🎵", "Spotify"],
                  ["📸", "Instagram"],
                  ["✈️", "Telegram"],
                  ["🐦", "Twitter / X"],
                  ["👥", "Facebook"],
                  ["👻", "Snapchat"],
                  ["💼", "LinkedIn"],
                  ["🤖", "Google Assistant"],
                  ["💰", "Google Pay"],
                  ["📱", "PhonePe"],
                  ["💳", "Paytm"],
                  ["🎬", "Netflix"],
                  ["🛒", "Amazon"],
                  ["📹", "Zoom"],
                  ["⚙️", "Settings"],
                  ["📷", "Camera"],
                  ["🧮", "Calculator"],
                ].map(([icon, name]) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 text-xs text-gray-400 bg-[#0d0d0d] border border-[#151515] px-2.5 py-1.5 rounded-lg"
                  >
                    <span>{icon}</span> {name}
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="p-7">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-green-400">→</span> How it works
              </h3>
              <div className="space-y-4 mb-6">
                {[
                  {
                    step: "1",
                    title: "You type a command",
                    desc: 'Say "open WhatsApp" or "launch Google Assistant" in the chat',
                  },
                  {
                    step: "2",
                    title: "AI detects the app",
                    desc: "SAION AI identifies which app you want and its Android package name",
                  },
                  {
                    step: "3",
                    title: "Checks if installed",
                    desc: "Uses Android intent URLs to verify the app exists on your device",
                  },
                  {
                    step: "4",
                    title: "Opens it instantly",
                    desc: "App launches immediately if installed. If not, shows Play Store link",
                  },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-900/40 border border-green-700/40 flex items-center justify-center text-xs font-bold text-green-400 shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {s.title}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0a0a0a] border border-[#151515] rounded-xl p-4">
                <p className="text-[11px] text-gray-600 mb-2 uppercase tracking-wider font-medium">
                  Example commands
                </p>
                {[
                  '"Open WhatsApp"',
                  '"Launch Google Assistant"',
                  '"Open Spotify"',
                  '"Start Google Maps"',
                ].map((cmd) => (
                  <div
                    key={cmd}
                    className="text-xs text-green-400 font-mono bg-green-900/10 border border-green-800/20 px-3 py-1.5 rounded-lg mb-1.5"
                  >
                    {cmd}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-900/15 border border-amber-800/25 rounded-xl">
                <span className="text-amber-400 text-base shrink-0">⚠️</span>
                <p className="text-xs text-amber-300/80">
                  This feature works <strong>only on Android</strong> with the
                  SAION AI app installed. It does not work in browsers on
                  Windows or iOS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted banner ────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className="bg-gradient-to-r from-violet-950/40 via-[#0d0d0d] to-violet-950/40 border border-violet-600/20 rounded-3xl p-8 text-center shadow-2xl">
          <div className="flex justify-center mb-4">
            <SaionLogo size={44} animated />
          </div>
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            Trusted & Secure
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-5">
            SAION AI uses end-to-end encrypted chat history. Your conversations
            are private and never shared with anyone.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              "🔒 End-to-End Encrypted",
              "🛡️ No Data Sharing",
              "🌍 50+ Languages",
              ,
            ].map((tag, i) => (
              <span
                key={i}
                className="text-xs text-gray-400 bg-[#111] border border-[#1e1e1e] px-3 py-1.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Android App Launcher Info ─────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <div className="bg-[#080808] border border-violet-600/20 rounded-3xl p-7 shadow-xl">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shrink-0 text-2xl shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              📱
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-xl font-bold text-white">
                  Android App Launcher
                </h3>
                <span className="text-[11px] bg-violet-900/60 text-violet-300 border border-violet-600/30 px-2.5 py-0.5 rounded-full font-semibold">
                  ANDROID ONLY
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                This feature is exclusively available on Android devices with
                the SAION AI app installed. Just tell SAION AI to open any app —
                it checks if the app is installed on your device first, then
                launches it instantly without leaving the chat.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Apps you can open
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  "WhatsApp",
                  "Instagram",
                  "YouTube",
                  "Spotify",
                  "Gmail",
                  "Chrome",
                  "Google Maps",
                  "Telegram",
                  "Twitter/X",
                  "Facebook",
                  "Netflix",
                  "Zoom",
                  "Google Pay",
                  "PhonePe",
                  "Paytm",
                  "Google Assistant",
                  "Calculator",
                  "Camera",
                  "Settings",
                  "free fire",
                  "Snapchat",
                ].map((app, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-400 flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-violet-500 shrink-0" />
                    {app}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Example commands
              </p>
              <div className="space-y-2">
                {[
                  {
                    cmd: '"Open WhatsApp"',
                    desc: "Launches WhatsApp if installed",
                  },
                  {
                    cmd: '"Open Google Assistant"',
                    desc: "Activates Google Assistant",
                  },
                  { cmd: '"Open Instagram"', desc: "Opens Instagram app" },
                  { cmd: '"Open Google Maps"', desc: "Launches navigation" },
                  { cmd: '"Open Calculator"', desc: "Opens calculator app" },
                  { cmd: '"Open Camera"', desc: "Opens device camera" },
                ].map((ex, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-violet-400 font-mono text-xs shrink-0 mt-0.5">
                      →
                    </span>
                    <div>
                      <span className="text-white text-xs font-medium">
                        {ex.cmd}
                      </span>
                      <span className="text-gray-600 text-xs ml-1.5">
                        {ex.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-900/15 border border-amber-800/25 rounded-xl">
            <span className="text-amber-400 shrink-0">⚠️</span>
            <p className="text-amber-300/80 text-xs">
              This feature only works on <strong>Android devices</strong> with
              the SAION AI APK installed. It does not work in web browsers,
              Windows, or Linux versions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#0f0f0f] mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SaionLogo size={28} animated={false} />
            <div>
              <span className="font-display font-bold text-white text-sm">
                SAION AI
              </span>
              <p className="text-[11px] text-gray-700">
                Created by Saion Production
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/chat")}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Open Chat
            </button>
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Terms
            </a>
          </div>
          <p className="text-xs text-gray-700">
            © 2005–2026 Saion Production · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
