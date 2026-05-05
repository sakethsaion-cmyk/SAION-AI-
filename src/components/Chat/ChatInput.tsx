import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Paperclip, Image, StopCircle, X } from 'lucide-react'
import { Attachment } from '../../types'
import { v4 as uuidv4 } from 'uuid'

interface ChatInputProps {
  onSend: (text: string, attachments?: Attachment[]) => void
  disabled?: boolean
  limitReached?: boolean
  onStop?: () => void
  isSending?: boolean
}

export default function ChatInput({ onSend, disabled, limitReached, onStop: _onStop, isSending: _isSending }: ChatInputProps) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordError, setRecordError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [text])

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || disabled || limitReached) return
    onSend(text.trim(), attachments)
    setText('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFiles = (files: FileList | null, type: 'file' | 'image' | 'video') => {
    if (!files) return
    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|m4v|3gp)$/i.test(file.name)
      const resolvedType: 'file' | 'image' | 'video' = isVideo ? 'video' : type
      const reader = new FileReader()
      reader.onload = ev => {
        setAttachments(prev => [...prev, {
          id: uuidv4(),
          name: file.name,
          type: resolvedType,
          url: ev.target?.result as string,
          size: file.size,
          mimeType: file.type,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const startVoice = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecordError('Voice input not supported in this browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      setText(transcript)
    }
    recognition.onerror = () => {
      setIsRecording(false)
      setRecordError('Voice recognition error. Try again.')
      setTimeout(() => setRecordError(''), 3000)
    }
    recognition.onend = () => setIsRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
    setRecordError('')
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  if (limitReached) {
    return (
      <div className="p-4 border-t border-[#141414] bg-[#060606]">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 py-3 px-4 bg-amber-900/20 border border-amber-800/30 rounded-xl">
          <span className="text-amber-400 text-sm">Daily message limit reached (200/200). Resets at midnight.</span>
          <button className="shimmer-btn text-white text-xs px-3 py-1.5 rounded-lg font-medium">
            Upgrade to Pro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-[#141414] bg-[#060606] px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {attachments.map(a => (
              <div key={a.id} className="flex items-center gap-1.5 bg-[#111] border border-[#1e1e1e] rounded-lg px-2 py-1 text-xs text-gray-400">
                {a.type === 'image' ? (
                  <img src={a.url} alt={a.name} className="w-5 h-5 rounded object-cover" />
                ) : a.type === 'video' ? (
                  <span className="text-violet-400 text-xs">🎬</span>
                ) : (
                  <Paperclip size={11} className="text-violet-400" />
                )}
                <span className="max-w-[120px] truncate">{a.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} className="text-gray-600 hover:text-red-400 ml-0.5">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Record error */}
        {recordError && (
          <p className="text-red-400 text-xs mb-2">{recordError}</p>
        )}

        {/* Input area */}
        <div className={`flex items-end gap-2 bg-[#0e0e0e] border rounded-2xl px-3 py-2.5 transition-all duration-200 ${
          isRecording ? 'border-red-600/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'border-[#1e1e1e] focus-within:border-violet-600/40 focus-within:shadow-[0_0_12px_rgba(124,58,237,0.15)]'
        }`}>
          {/* File uploads */}
          <div className="flex items-center gap-1 pb-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded-lg hover:bg-white/5"
              title="Attach file"
            >
              <Paperclip size={16} />
            </button>
            <button
              onClick={() => imgInputRef.current?.click()}
              disabled={disabled}
              className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded-lg hover:bg-white/5"
              title="Attach image"
            >
              <Image size={16} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={isRecording ? '🎙️ Listening…' : 'Message SAION AI…'}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-600 resize-none outline-none text-sm leading-relaxed py-0.5 max-h-[180px] font-sans"
          />

          {/* Voice + Send */}
          <div className="flex items-center gap-1 pb-0.5">
            <button
              onClick={isRecording ? stopVoice : startVoice}
              className={`p-1.5 rounded-xl transition-all ${
                isRecording
                  ? 'text-red-400 bg-red-900/20 animate-pulse'
                  : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? <StopCircle size={16} /> : <Mic size={16} />}
            </button>

            <button
              onClick={handleSend}
              disabled={(!text.trim() && attachments.length === 0) || disabled}
              className="p-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(124,58,237,0.3)] hover:shadow-[0_0_15px_rgba(124,58,237,0.5)]"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-2">
          SAION AI can make mistakes. Verify important info.
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.json,.zip,.py,.js,.ts,.mp4,.webm,.mov,.avi,.mkv,.m4v,.3gp,video/*"
        className="hidden"
        onChange={e => handleFiles(e.target.files, 'file')}
      />
      <input
        ref={imgInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => handleFiles(e.target.files, 'image')}
      />
    </div>
  )
}
