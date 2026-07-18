import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Download, ExternalLink, Globe, ImageOff, RefreshCw, FolderOpen, FileCode, Edit2, X, RotateCcw } from 'lucide-react'
import { Message } from '../../types'
import SaionLogo from '../UI/SaionLogo'

interface Props {
  message: Message
  onEdit?: (messageId: string, newContent: string) => void
  onResend?: (content: string) => void
  isLastUserMessage?: boolean
  isStreaming?: boolean  // true while AI is actively streaming this message
}

export default function MessageBubble({ message, onEdit, onResend, isLastUserMessage, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)

  const handleEditSave = () => {
    if (!editText.trim() || editText === message.content) { setEditing(false); return }
    onEdit?.(message.id, editText.trim())
    setEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
    if (e.key === 'Escape') { setEditing(false); setEditText(message.content); }
  }

  return (
    <div className={`flex gap-3 group msg-animate mb-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-700 to-violet-900 flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.3)] mt-1 ${isStreaming ? 'logo-thinking' : ''}`}>
          <SaionLogo size={20} animated={false} />
        </div>
      )}

      <div className={`flex flex-col max-w-[88%] md:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && <span className="text-[10px] text-gray-600 mb-1.5 px-1 font-display tracking-wide">SAION AI</span>}

        {/* ── Edited Video ── */}
        {message.type === 'video' && message.metadata?.videoUrl && (
          <VideoDownloadCard url={message.metadata.videoUrl} name={message.metadata.videoName || 'edited-video.webm'} summary={message.metadata.videoEditSummary || ''} />
        )}

        {/* ── Generated Image ── */}
        {message.type === 'image' && message.metadata?.imageUrl && (
          <ImagePlayer url={message.metadata.imageUrl} caption={message.metadata.imageCaption || 'AI Generated Image'} />
        )}

        {/* ── Website Preview ── */}
        {message.type === 'website' && message.metadata?.websiteHtml && (
          <WebsiteCard html={message.metadata.websiteHtml} />
        )}

        {/* ── VS Code Project ── */}
        {message.type === 'project' && message.metadata?.projectFiles && (
          <ProjectCard
            name={message.metadata.projectName || 'my-project'}
            structure={message.metadata.projectStructure || ''}
            files={message.metadata.projectFiles}
            setup={message.metadata.projectSetup || ''}
            techStack={message.metadata.projectTechStack || ''}
          />
        )}

        {/* ── Text bubble with edit support ── */}
        {message.content && message.content !== '▋' && (
          <div className="relative w-full">
            {isUser && editing ? (
              /* Edit mode */
              <div className="flex flex-col gap-2 w-full">
                <textarea
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={Math.min(editText.split('\n').length + 1, 8)}
                  className="w-full bg-[#1a1a1a] border border-violet-600/50 rounded-2xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-violet-500 min-w-[200px]"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setEditing(false); setEditText(message.content); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white text-xs transition-colors"
                  >
                    <X size={11} /> Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={!editText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                  >
                    <Check size={11} /> Save & Resend
                  </button>
                </div>
              </div>
            ) : (
              /* Normal bubble */
              <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                isUser
                  ? 'bg-violet-600 text-white rounded-br-md'
                  : 'bg-[#111] text-gray-200 border border-[#1e1e1e] rounded-bl-md'
              }`}>
                {isUser
                  ? <p className="whitespace-pre-wrap">{message.content}</p>
                  : <MarkdownContent content={message.content} />
                }

                {/* Edit button — shows on hover for user messages */}
                {isUser && onEdit && (
                  <button
                    onClick={() => setEditing(true)}
                    className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-600 hover:text-violet-400"
                    title="Edit message"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {message.content === '▋' && (
          <div className={`bg-[#111] border rounded-2xl rounded-bl-md px-4 py-4 ${isStreaming ? 'border-violet-700/40 logo-thinking' : 'border-[#1e1e1e]'}`}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
              <span className="text-xs text-gray-600">SAION AI is thinking…</span>
            </div>
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {message.attachments.map(a => (
              <div key={a.id} className="flex items-center gap-1.5 bg-[#111] border border-[#1e1e1e] rounded-lg px-2.5 py-1.5 text-xs text-gray-400">
                {a.type === 'image'
                  ? <img src={a.url} alt={a.name} className="w-5 h-5 object-cover rounded" />
                  : <span className="text-violet-400">📎</span>}
                {a.name}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[10px] text-gray-700">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {/* Resend button for last user message */}
          {isUser && isLastUserMessage && onResend && !editing && (
            <button
              onClick={() => onResend(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-600 hover:text-violet-400 flex items-center gap-1"
              title="Resend message"
            >
              <RotateCcw size={10} /> Resend
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold mt-1">
          U
        </div>
      )}
    </div>
  )
}

// ─── Image Player ─────────────────────────────────────────────────────────────
function ImagePlayer({ url, caption }: { url: string; caption: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [currentUrl, setCurrentUrl] = useState(url)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => { setStatus('loading'); setCurrentUrl(url); setRetryCount(0); }, [url])

  const retry = () => {
    const newUrl = url.includes('?') ? url.replace(/&?t=\d+/, '') + `&t=${Date.now()}` : url + `?t=${Date.now()}`
    setCurrentUrl(newUrl); setStatus('loading'); setRetryCount(r => r + 1)
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(currentUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl; a.download = `saion-ai-${Date.now()}.png`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch {
      window.open(currentUrl, '_blank')
    } finally { setDownloading(false) }
  }

  return (
    <div className="mb-2 rounded-2xl overflow-hidden border border-[#1e1e1e] bg-[#080808]" style={{ maxWidth: 460 }}>
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center h-64 gap-4 image-skeleton">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 font-medium">Generating your image</p>
            <p className="text-xs text-gray-600 mt-1">FLUX AI • Up to 30 seconds</p>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center h-52 gap-3 bg-[#0d0d0d]">
          <ImageOff size={28} className="text-gray-600" />
          <p className="text-xs text-gray-500">Image generation failed</p>
          {retryCount < 3 && (
            <button onClick={retry} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-900/30 border border-violet-700/30 text-violet-400 text-xs">
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>
      )}
      <img
        key={currentUrl} src={currentUrl} alt={caption}
        className={`w-full block transition-opacity duration-700 ${status === 'loaded' ? 'opacity-100' : 'opacity-0 h-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => { if (retryCount < 2) setTimeout(retry, 3000); else setStatus('error'); }}
      />
      {status === 'loaded' && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-t border-[#141414]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
            <span className="text-xs text-gray-400 truncate">{caption}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button onClick={retry} title="Regenerate" className="p-1.5 rounded-lg text-gray-600 hover:text-violet-400 transition-colors">
              <RefreshCw size={13} />
            </button>
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors">
              {downloading ? <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><Download size={12} /> Download</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Video Download Card ──────────────────────────────────────────────────────
function VideoDownloadCard({ url, name, summary }: { url: string; name: string; summary: string }) {
  const [downloading, setDownloading] = useState(false)
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(url); const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = blobUrl; a.download = name
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch { window.open(url, '_blank') }
    finally { setDownloading(false) }
  }
  return (
    <div className="mb-2 rounded-2xl overflow-hidden border border-violet-600/30 bg-[#0a0a0a]" style={{ maxWidth: 460 }}>
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        <span className="text-lg">🎬</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{name}</p>
          {summary && <p className="text-gray-500 text-[10px] truncate mt-0.5">{summary}</p>}
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-700/20 px-2 py-0.5 rounded-full shrink-0">Ready</span>
      </div>
      <div className="p-3">
        <video src={url} controls playsInline className="w-full rounded-xl border border-[#1a1a1a] bg-black" style={{ maxHeight: 260 }} />
      </div>
      <div className="px-3 pb-3">
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-all">
          {downloading ? <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><Download size={13} /> Download Edited Video</>}
        </button>
      </div>
    </div>
  )
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || '')
          const code = String(children).replace(/\n$/, '')
          if (code.includes('\n') || match) return <CodeBlock language={match?.[1]} code={code} />
          return <code className="bg-[#1a1a1a] text-violet-300 px-1.5 py-0.5 rounded text-[0.82em] font-mono">{children}</code>
        },
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">{children}</a>,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-2 font-display">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-1.5 font-display">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold text-gray-100 mb-1">{children}</h3>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-violet-600 pl-3 my-2 text-gray-400 italic">{children}</blockquote>,
        table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
        th: ({ children }) => <th className="border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-left font-semibold text-gray-300">{children}</th>,
        td: ({ children }) => <td className="border border-[#2a2a2a] px-3 py-1.5 text-gray-400">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="my-2 rounded-xl overflow-hidden border border-[#222]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        <span className="text-[11px] text-gray-500 font-mono">{language || 'code'}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white transition-colors">
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter language={language || 'text'} style={oneDark} customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.78rem', background: '#0a0a0a' }} showLineNumbers>
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

function WebsiteCard({ html }: { html: string }) {
  const [modal, setModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(html); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <>
      <div className="mb-2 rounded-2xl overflow-hidden border border-violet-600/20 bg-[#0a0a0a]" style={{ maxWidth: 420 }}>
        <div className="flex items-center justify-between px-3 py-2 bg-[#0d0d0d] border-b border-[#141414]">
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Globe size={12} className="text-violet-400" /> AI-Generated Website</div>
          <div className="flex gap-2">
            <button onClick={copy} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}{copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={() => setModal(true)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <ExternalLink size={11} /> Preview
            </button>
          </div>
        </div>
        <div className="p-3">
          <iframe srcDoc={html} title="Preview" className="w-full rounded-lg border border-[#1a1a1a]" style={{ height: 180, pointerEvents: 'none' }} sandbox="allow-scripts" />
        </div>
      </div>
      {modal && <WebsiteModal html={html} onClose={() => setModal(false)} />}
    </>
  )
}

function WebsiteModal({ html, onClose }: { html: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(html); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const exportHtml = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'saion-website.html'; a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><Globe size={15} className="text-violet-400" /> Website Preview</div>
          <div className="flex items-center gap-2">
            <button onClick={copy} className="saion-btn-ghost text-xs flex items-center gap-1.5">
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy HTML'}
            </button>
            <button onClick={exportHtml} className="saion-btn-primary text-xs flex items-center gap-1.5"><Download size={12} /> Export</button>
            <button onClick={onClose} className="text-gray-600 hover:text-white ml-1 text-lg leading-none">✕</button>
          </div>
        </div>
        <div className="flex-1 p-4">
          <iframe srcDoc={html} title="Website" className="w-full h-full rounded-xl border border-[#1a1a1a]" sandbox="allow-scripts allow-same-origin allow-forms" />
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ name, structure, files, setup, techStack }: { name: string; structure: string; files: { path: string; content: string }[]; setup: string; techStack: string }) {
  const [showStructure, setShowStructure] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const downloadZip = async () => {
    setDownloading(true)
    try {
      const fileListHtml = files.map(f => `<div class="file"><h3>${f.path}</h3><pre>${f.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>`).join('')
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title><style>body{font-family:monospace;background:#0d0d0d;color:#e0e0e0;padding:20px;max-width:900px;margin:0 auto}h1{color:#a78bfa}.file{margin:20px 0;background:#111;border:1px solid #222;border-radius:8px;overflow:hidden}.file h3{margin:0;padding:10px 16px;background:#1a1a1a;color:#60a5fa;font-size:13px}pre{margin:0;padding:16px;overflow-x:auto;font-size:12px;white-space:pre-wrap}</style></head><body><h1>📁 ${name}</h1><p style="color:#9ca3af">${techStack}</p><pre style="background:#0a1a0a;border:1px solid #1a3a1a;border-radius:8px;padding:16px;color:#4ade80">${setup}</pre>${fileListHtml}</body></html>`
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${name}-project.html`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  return (
    <div className="w-full max-w-lg bg-[#0a0a0a] border border-violet-700/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)] mb-2">
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-900/40 to-[#0a0a0a] border-b border-violet-700/20">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center"><FolderOpen size={18} className="text-white" /></div>
        <div className="flex-1 min-w-0"><p className="text-white font-semibold text-sm truncate">{name}</p><p className="text-violet-400 text-xs">{techStack}</p></div>
        <span className="text-xs bg-violet-900/40 text-violet-300 border border-violet-700/30 px-2 py-0.5 rounded-full">{files.length} files</span>
      </div>
      <div className="px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Setup</span>
          <button onClick={() => { navigator.clipboard.writeText(setup); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white">
            {copied ? <><Check size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>
        <pre className="text-xs text-green-400 bg-[#0a1a0a] border border-[#1a3a1a] rounded-lg px-3 py-2 overflow-x-auto">{setup}</pre>
      </div>
      <div className="px-4 py-2.5 border-b border-[#1a1a1a]">
        <button onClick={() => setShowStructure(!showStructure)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white w-full">
          <FileCode size={13} />{showStructure ? 'Hide' : 'Show'} files<span className="ml-auto">{showStructure ? '▲' : '▼'}</span>
        </button>
        {showStructure && <pre className="mt-2 text-xs text-gray-400 bg-[#0d0d0d] rounded-lg px-3 py-2 overflow-x-auto">{structure || files.map(f => f.path).join('\n')}</pre>}
      </div>
      <div className="px-4 py-3">
        <button onClick={downloadZip} disabled={downloading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-800 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60">
          {downloading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Preparing…</> : <><Download size={15} /> Download Project Files</>}
        </button>
      </div>
    </div>
  )
}
