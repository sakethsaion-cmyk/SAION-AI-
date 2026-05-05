import React, { useState } from 'react'
import { Check, X, Crown, Zap, MessageSquare, Image, FileText, Music, Youtube, Globe, Mic, Code } from 'lucide-react'

interface Props {
  onClose: () => void
}

const FREE_FEATURES = [
  { icon: <MessageSquare size={14}/>, text: '200 messages per day', limit: true },
  { icon: <Image size={14}/>,         text: '7 photo uploads total', limit: true },
  { icon: <FileText size={14}/>,      text: '2 file uploads total', limit: true },
  { icon: <Music size={14}/>,         text: 'Spotify 30s previews only', limit: true },
  { icon: <Youtube size={14}/>,       text: 'YouTube playback in chat', limit: false },
  { icon: <Globe size={14}/>,         text: 'AI Website Builder', limit: false },
  { icon: <Mic size={14}/>,           text: 'Voice input', limit: false },
  { icon: <Code size={14}/>,          text: 'Code generation', limit: false },
  { icon: <Image size={14}/>,         text: 'Image generation', limit: false },
]

const PRO_FEATURES = [
  { icon: <MessageSquare size={14}/>, text: 'Unlimited messages', highlight: true },
  { icon: <Image size={14}/>,         text: 'Unlimited photo uploads', highlight: true },
  { icon: <FileText size={14}/>,      text: 'Unlimited file uploads', highlight: true },
  { icon: <Music size={14}/>,         text: 'Full Spotify songs in chat', highlight: true },
  { icon: <Youtube size={14}/>,       text: 'YouTube playback in chat', highlight: false },
  { icon: <Globe size={14}/>,         text: 'AI Website Builder', highlight: false },
  { icon: <Mic size={14}/>,           text: 'Voice input', highlight: false },
  { icon: <Code size={14}/>,          text: 'Code generation', highlight: false },
  { icon: <Image size={14}/>,         text: 'Image generation', highlight: false },
  { icon: <Crown size={14}/>,         text: 'Priority AI responses', highlight: true },
  { icon: <Zap size={14}/>,           text: 'Early access to new features', highlight: true },
]

export default function PricingModal({ onClose }: Props) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  const price = billing === 'monthly' ? '$6' : '$72'
  const perMonth = billing === 'monthly' ? '$6/mo' : '$6/mo'
  const saving = billing === 'yearly' ? 'Best value — 2 months free!' : null

  const handleUpgrade = async () => {
    setLoading(true)
    // TODO: integrate Stripe here
    // For now show alert
    setTimeout(() => {
      setLoading(false)
      alert('Stripe integration coming soon! Add your Stripe key in the code to enable payments.')
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(124,58,237,0.2)]">
        {/* Header */}
        <div className="relative px-6 pt-7 pb-4 border-b border-[#111]">
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-600 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Crown size={18} className="text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">SAION AI Plans</h2>
          </div>
          <p className="text-gray-500 text-sm">Unlock the full power of SAION AI</p>

          {/* Billing toggle */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${billing === 'yearly' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Yearly
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-4 p-6">

          {/* Free Plan */}
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
            <div className="mb-4">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Current Plan</p>
              <h3 className="font-display text-xl font-bold text-white">Free</h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-gray-500 text-sm mb-1">/month</span>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className={`flex items-center gap-2.5 text-sm ${f.limit ? 'text-gray-500' : 'text-gray-300'}`}>
                  <span className={`shrink-0 ${f.limit ? 'text-orange-500' : 'text-green-500'}`}>
                    {f.limit ? <X size={14}/> : <Check size={14}/>}
                  </span>
                  <span className={f.limit ? 'line-through opacity-60' : ''}>{f.text}</span>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 bg-[#111] border border-[#1e1e1e] rounded-xl text-center">
              <span className="text-gray-500 text-sm">Your current plan</span>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-gradient-to-b from-violet-950/40 to-[#0d0d0d] border border-violet-600/40 rounded-2xl p-5 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-violet-600 to-violet-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                ✦ RECOMMENDED
              </span>
            </div>

            <div className="mb-4 mt-1">
              <p className="text-violet-400 text-xs uppercase tracking-widest mb-1">Upgrade to</p>
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                Pro <Crown size={16} className="text-amber-400" />
              </h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-3xl font-bold text-white">{price}</span>
                <span className="text-gray-400 text-sm mb-1">/{billing === 'monthly' ? 'month' : 'year'}</span>
              </div>
              {billing === 'yearly' && (
                <p className="text-xs text-green-400 mt-1">= $6/mo · 2 months FREE 🎉</p>
              )}
              {saving && (
                <p className="text-[11px] text-amber-400 mt-0.5">{saving}</p>
              )}
            </div>

            <div className="space-y-2.5 mb-5">
              {PRO_FEATURES.map((f, i) => (
                <div key={i} className={`flex items-center gap-2.5 text-sm ${f.highlight ? 'text-white' : 'text-gray-400'}`}>
                  <span className="text-green-400 shrink-0"><Check size={14}/></span>
                  {f.highlight ? <span className="font-medium">{f.text}</span> : <span>{f.text}</span>}
                  {f.highlight && <span className="ml-auto text-[10px] bg-violet-900/40 text-violet-400 border border-violet-700/30 px-1.5 py-0.5 rounded-full">PRO</span>}
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white shimmer-btn shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Upgrade to Pro — ${price}/${billing === 'monthly' ? 'mo' : 'yr'}`
              )}
            </button>

            <p className="text-center text-gray-600 text-xs mt-3">
              Cancel anytime · Secure payment via Stripe
            </p>
          </div>
        </div>

        {/* Bottom note */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl">
            <span className="text-amber-400">⚡</span>
            <p className="text-xs text-gray-500">
              Pro access is instant after payment. All features unlock immediately with no delays.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
