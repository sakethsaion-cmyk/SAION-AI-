import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Download,
  Sparkles,
  Code,
  Image,
  Music,
  Globe,
  Mic,
  FileText,
  Crown,
  ArrowRight,
} from "lucide-react";
import SaionLogo from "../components/UI/SaionLogo";

// ─── Demo AI powered by OpenRouter (same key, limited to 8 messages) ────────
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const DEMO_LIMIT = 8;

interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const FEATURES = [
  {
    icon: <Sparkles size={14} />,
    label: "Unlimited AI Chat",
    color: "text-violet-400",
  },
  {
    icon: <Code size={14} />,
    label: "Code Generation",
    color: "text-blue-400",
  },
  {
    icon: <Image size={14} />,
    label: "Image Generation",
    color: "text-pink-400",
  },
  {
    icon: <Music size={14} />,
    label: "Spotify Playback",
    color: "text-green-400",
  },
  {
    icon: <Globe size={14} />,
    label: "YouTube in Chat",
    color: "text-red-400",
  },
  {
    icon: <Globe size={14} />,
    label: "Website Builder",
    color: "text-amber-400",
  },
  { icon: <Mic size={14} />, label: "Voice Input", color: "text-teal-400" },
  {
    icon: <FileText size={14} />,
    label: "File Uploads",
    color: "text-orange-400",
  },
  {
    icon: <Crown size={14} />,
    label: "Private History",
    color: "text-yellow-400",
  },
];

// Sign-in wall component shown before demo
function DemoSignIn({ onContinue }: { onContinue: (name: string) => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onContinue(name.trim());
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 mb-4 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
            <SaionLogo size={40} animated />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            SAION <span className="text-violet-400">AI</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Try SAION AI Demo Chat — 8 free messages
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-7 shadow-2xl">
          {/* Demo limit info */}
          <div className="flex items-center gap-3 mb-6 p-3.5 bg-violet-900/15 border border-violet-600/20 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                8 free demo messages
              </p>
              <p className="text-gray-500 text-xs">
                Download SAION AI for full unlimited access
              </p>
            </div>
          </div>

          <h2 className="text-white font-display text-lg font-semibold mb-1">
            Sign in to continue
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Enter your details to get started
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your name"
                className="saion-input"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your email"
                className="saion-input"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Start Demo Chat <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="mt-4 pt-4 border-t border-[#141414] flex items-center justify-between">
            <p className="text-gray-600 text-xs">Want full access?</p>
            <button
              onClick={() => navigate("/download")}
              className="text-violet-400 hover:text-violet-300 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Download size={11} /> Download SAION AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Limit reached wall
function LimitReached({
  navigate,
}: {
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-10 text-center animate-fade-in">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
        <Crown size={28} className="text-yellow-400" />
      </div>

      <h2 className="font-display text-2xl font-bold text-white mb-2">
        Demo Complete! 🎉
      </h2>
      <p className="text-gray-500 text-sm max-w-sm mb-7 leading-relaxed">
        You've experienced SAION AI! Download the full app to unlock unlimited
        messages, Spotify, YouTube in chat, image generation, website builder,
        voice input and much more.
      </p>

      {/* Features grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-8 w-full max-w-sm">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl"
          >
            <span className={f.color}>{f.icon}</span>
            <span className="text-[10px] text-gray-500 text-center leading-tight">
              {f.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={() => navigate("/download")}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 shimmer-btn text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.4)]"
        >
          <Download size={16} /> Download SAION AI
        </button>
        <button
          onClick={() => navigate("/chat")}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#111] hover:bg-[#151515] border border-[#1e1e1e] text-gray-400 hover:text-white font-medium text-sm rounded-xl transition-all"
        >
          Sign In →
        </button>
      </div>
    </div>
  );
}

// ─── Main Demo Page ──────────────────────────────────────────────────────────
export default function DemoPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Edit message in demo chat
  const handleDemoEdit = (msgId: string, newContent: string) => {
    const idx = messages.findIndex(m => m.id === msgId);
    if (idx === -1) return;
    // Keep messages up to the edited one, update its content
    setMessages(prev => prev.slice(0, idx).concat({ ...prev[idx], content: newContent }));
    setInput(newContent);
    // Focus input so user can resend
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSending(false);
    // Remove the loading message
    setMessages(prev => prev.filter(m => m.content !== '▋'));
  };
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const remaining = DEMO_LIMIT - msgCount;

  const handleStart = (name: string) => {
    setUserName(name);
    // First welcome message from AI
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hi ${name}! 👋 I'm **SAION AI**, your advanced AI assistant created by **Saion Production**.\n\n🎯 This is a **demo chat** — try all my features right here!\n\n✅ What I can do:\n- 💬 Answer anything in any language (English, Hindi, Telugu & more)\n- 💻 Generate and explain code\n- 🎨 Create AI images\n- Edit Your Videos Using AI\n- 🌐 Build websites from descriptions\n- 📱 Open apps on your Android device\n- 🎙️ Voice input support\n\n📥 **Want full access?** Download SAION AI — unlimited messages, all features unlocked!\n\nYou have **8 messages** in this session. What would you like to try first?`,
      },
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || limitReached) return;

    const userText = input.trim();
    setInput("");

    const newCount = msgCount + 1;
    setMsgCount(newCount);

    // Add user message
    const userMsg: DemoMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userText,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Check if this is the last message
    const isLast = newCount >= DEMO_LIMIT;
    setSending(true);

    // Build context
    const contextMsgs = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Remaining after this message
    const afterThis = DEMO_LIMIT - newCount;

    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error('API key not configured. Please check Netlify environment variables.');
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://saion.netlify.app",
          "X-Title": "SAION AI Demo",
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-72b-instruct",
          messages: [
            {
              role: "system",
              content: `You are SAION AI, an advanced AI assistant created by Saion Production. You are helpful, friendly, smart and multilingual. This is a demo session. Always introduce yourself as SAION AI. Reply in the same language the user writes in. Keep responses clear and helpful. ${afterThis > 0 ? `After every response add: "💬 ${afterThis} demo message${afterThis === 1 ? "" : "s"} left. 📥 Download SAION AI for unlimited access!"` : `After your response add: "🎉 Last demo message! 📥 Download SAION AI for unlimited messages, image generation, YouTube, and more! 🚀"`}`,
            },
            ...contextMsgs,
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = (errData as any)?.error?.message || `API error ${res.status}`;
        throw new Error(errMsg);
      }

      const data = await res.json();
      const aiText =
        data?.choices?.[0]?.message?.content?.trim() ||
        "I received your message but couldn't generate a response. Please try again.";

      setMessages((prev) => [
        ...prev.filter(m => m.content !== '▋'),
        { id: `a-${Date.now()}`, role: "assistant", content: aiText },
      ]);

      if (isLast) {
        setTimeout(() => setLimitReached(true), 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[SAION Demo] API error:", msg);
      // Don't show error if user manually stopped
      if (msg !== 'signal is aborted without reason' && !msg.includes('aborted')) {
        setMessages((prev) => [
          ...prev.filter(m => m.content !== '▋'),
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ ${msg.includes("API key") ? "AI service not configured. Please contact support." : "Something went wrong. Please try again in a moment."}`,
          },
        ]);
      } else {
        setMessages(prev => prev.filter(m => m.content !== '▋'));
      }
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show sign-in wall first
  if (!userName) return <DemoSignIn onContinue={handleStart} />;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#141414] bg-[#060606]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center">
            <SaionLogo size={20} animated />
          </div>
          <div>
            <span className="font-display font-bold text-white text-sm">
              SAION AI
            </span>
            <span className="block text-[10px] text-gray-600">
              by Saion Production
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Message counter */}
          {!limitReached && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                remaining <= 2
                  ? "bg-red-900/20 border-red-800/30 text-red-400"
                  : remaining <= 4
                    ? "bg-amber-900/20 border-amber-800/30 text-amber-400"
                    : "bg-violet-900/20 border-violet-800/30 text-violet-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${remaining <= 2 ? "bg-red-400" : remaining <= 4 ? "bg-amber-400" : "bg-violet-400"} animate-pulse`}
              />
              {remaining} message{remaining !== 1 ? "s" : ""} left
            </div>
          )}

          <button
            onClick={() => navigate("/download")}
            className="flex items-center gap-1.5 px-3 py-1.5 shimmer-btn text-white text-xs font-semibold rounded-xl"
          >
            <Download size={12} /> Download
          </button>
        </div>
      </header>

      {/* ── Messages or limit screen ── */}
      {limitReached ? (
        <LimitReached navigate={navigate} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {msg.role === "assistant" && (
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center shrink-0 mt-1 ${sending && msg.content === '▋' ? 'logo-thinking' : ''}`}>
                      <SaionLogo size={16} animated={false} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-br-md"
                        : `bg-[#111] text-gray-200 border rounded-bl-md ${sending && idx === messages.length - 1 && msg.role === 'assistant' && msg.content !== '▋' ? 'border-violet-700/50 ai-bubble-active' : 'border-[#1e1e1e]'}`
                    }`}
                  >
                    {msg.content === '▋' ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex gap-1.5">
                          <div className="thinking-dot" />
                          <div className="thinking-dot" />
                          <div className="thinking-dot" />
                        </div>
                        <span className="text-xs text-gray-600">SAION AI is thinking…</span>
                      </div>
                    ) : (
                      <>
                        {msg.content}
                        {sending && idx === messages.length - 1 && msg.role === 'assistant' && (
                          <span className="streaming-cursor" />
                        )}
                      </>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <>
                      <button
                        onClick={() => handleDemoEdit(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-600 hover:text-violet-400 self-start mt-2"
                        title="Edit message"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">
                        {userName[0].toUpperCase()}
                      </div>
                    </>
                  )}
                </div>
              ))}



              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Input ── */}
          <div className="shrink-0 border-t border-[#141414] bg-[#060606] px-4 py-3">
            <div className="max-w-2xl mx-auto">
              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex-1 h-1 bg-[#111] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      remaining <= 2
                        ? "bg-red-500"
                        : remaining <= 4
                          ? "bg-amber-500"
                          : "bg-violet-500"
                    }`}
                    style={{ width: `${(remaining / DEMO_LIMIT) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-600 shrink-0">
                  {remaining}/{DEMO_LIMIT} demo messages left
                </span>
              </div>

              {/* Stop button — shown while sending */}
              {sending && (
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center gap-2 w-full py-2.5 mb-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-medium transition-all"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="2"/></svg>
                  Stop generating
                </button>
              )}

              <div className="flex items-end gap-2 bg-[#0e0e0e] border border-[#1e1e1e] focus-within:border-violet-600/40 rounded-2xl px-3 py-2.5 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={sending}
                  placeholder={`Message SAION AI…`}
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-gray-600 resize-none outline-none text-sm leading-relaxed py-0.5 max-h-[120px] font-sans"
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="p-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={15} />
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-700 mt-2">
                Demo session ·{" "}
                <button
                  onClick={() => navigate("/download")}
                  className="text-violet-500 hover:text-violet-400 transition-colors"
                >
                  Download for full access
                </button>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
