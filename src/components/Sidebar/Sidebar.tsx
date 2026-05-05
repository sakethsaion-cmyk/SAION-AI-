import React, { useState } from 'react'
import {
  Plus, Trash2, MessageSquare, X, ChevronRight,
  Sparkles, Brain, Coffee, Briefcase, Settings, LogOut,
  Download, Crown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../../contexts/ChatContext'
import { useAuth } from '../../contexts/AuthContext'
import SaionLogo from '../UI/SaionLogo'
import PricingModal from '../UI/PricingModal'
import { Personality } from '../../types'

const personalities: { id: Personality; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'helpful',   label: 'Helpful',   icon: <Sparkles size={13} />,  color: 'text-violet-400' },
  { id: 'technical', label: 'Technical', icon: <Brain size={13} />,     color: 'text-blue-400'   },
  { id: 'casual',    label: 'Casual',    icon: <Coffee size={13} />,    color: 'text-amber-400'  },
  { id: 'formal',    label: 'Formal',    icon: <Briefcase size={13} />, color: 'text-emerald-400'},
]

export default function Sidebar() {
  const {
    conversations, activeConversation, sidebarOpen, personality,
    setSidebarOpen, setPersonality, selectConversation,
    createNewConversation, deleteConv, isLoading
  } = useChat()
  const { userProfile, currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showPricing, setShowPricing] = useState(false)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    await deleteConv(id)
    setDeletingId(null)
  }

  const formatDate = (d: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(d).getTime()
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-6 h-14 bg-[#111] border border-r border-[#222] rounded-r-xl flex items-center justify-center text-gray-600 hover:text-violet-400 transition-colors md:flex hidden"
      >
        <ChevronRight size={14} />
      </button>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="md:hidden fixed inset-0 bg-black/60 z-40"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="fixed md:relative z-50 md:z-auto w-72 h-full bg-[#060606] border-r border-[#141414] flex flex-col shrink-0 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#141414]">
          <div className="flex items-center gap-3">
            <SaionLogo size={32} animated />
            <div>
              <span className="font-display font-bold text-white text-base tracking-wide">SAION AI</span>
              <span className="block text-[10px] text-gray-600 font-sans">by Saion Production</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-600 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Personality */}
        <div className="px-3 pb-2">
          <p className="text-[10px] text-gray-700 uppercase tracking-widest mb-2 px-1">Personality</p>
          <div className="grid grid-cols-2 gap-1.5">
            {personalities.map(p => (
              <button
                key={p.id}
                onClick={() => setPersonality(p.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  personality === p.id
                    ? `bg-[#1a1a1a] border border-violet-600/40 ${p.color}`
                    : 'text-gray-600 hover:text-gray-400 hover:bg-[#111] border border-transparent'
                }`}
              >
                <span className={personality === p.id ? p.color : ''}>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          <p className="text-[10px] text-gray-700 uppercase tracking-widest mb-2 px-1 pt-1">Conversations</p>
          {isLoading ? (
            <div className="space-y-1.5 px-1">
              {[1,2,3].map(i => (
                <div key={i} className="h-9 bg-[#111] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-700 text-xs text-center py-6">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                  activeConversation?.id === conv.id
                    ? 'bg-[#1a1a1a] border border-violet-600/20 text-white'
                    : 'text-gray-500 hover:bg-[#111] hover:text-gray-300'
                }`}
              >
                <MessageSquare size={13} className="shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{conv.title}</p>
                  <p className="text-[10px] text-gray-700">{formatDate(conv.updatedAt)}</p>
                </div>
                <button
                  onClick={e => handleDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all p-0.5"
                >
                  {deletingId === conv.id ? (
                    <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom: User + Download */}
        <div className="border-t border-[#141414] p-3 space-y-2">
          {/* Subscription badge */}
          {userProfile && !userProfile.isPaid && (
            <button
              onClick={() => setShowPricing(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800/30 rounded-lg transition-all group"
            >
              <Crown size={13} className="text-amber-400" />
              <span className="text-amber-400 text-xs flex-1 text-left">Free · {200 - (userProfile.dailyMessageCount || 0)}/200 msgs left</span>
              <span className="text-[10px] text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">Upgrade →</span>
            </button>
          )}
          {userProfile?.isPaid && (
            <button
              onClick={() => setShowPricing(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 bg-violet-900/20 hover:bg-violet-900/30 border border-violet-800/30 rounded-lg transition-all"
            >
              <Crown size={13} className="text-violet-400" />
              <span className="text-violet-400 text-xs">Pro Plan · Unlimited ✓</span>
            </button>
          )}

          {/* Download App — navigates to /download */}
          <button
            onClick={() => navigate('/download')}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-gray-500 hover:text-violet-400 hover:bg-[#111] rounded-lg text-xs transition-all"
          >
            <Download size={13} />
            Download Apps
          </button>

          {/* User */}
          <div className="flex items-center gap-2 px-2 py-1.5">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold">
                {currentUser?.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{currentUser?.displayName || 'User'}</p>
              <p className="text-[10px] text-gray-600 truncate">{currentUser?.email}</p>
            </div>
            <button onClick={signOut} className="text-gray-700 hover:text-red-400 transition-colors p-1" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
