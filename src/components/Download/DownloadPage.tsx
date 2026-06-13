import React, { useState } from 'react'
import { Download, Smartphone, Monitor, Terminal, Check, Star, Zap, Shield, Globe } from 'lucide-react'
import SaionLogo from '../UI/SaionLogo'

const GITHUB_BASE = 'https://github.com/sakethsaion-cmyk/SAION-AI-/releases/download/v1.0.1'

const platforms = [
  {
    id: 'android',
    name: 'Android',
    icon: <Smartphone size={28} />,
    badge: 'v1.0.1',
    size: '8.11 MB',
    ext: 'APK',
    color: 'from-green-600 to-emerald-700',
    glow: 'rgba(16,185,129,0.3)',
    borderColor: 'border-emerald-700/30',
    badge2: 'Android 8.0+',
    filename: 'app-release.apk',
    directLink: `${GITHUB_BASE}/app-release.apk`,
    description: 'Install directly on your Android phone or tablet. Enable "Unknown sources" in settings if prompted.',
  },
  {
    id: 'windows',
    name: 'Windows',
    icon: <Monitor size={28} />,
    badge: 'v1.0.1',
    size: '93.5 MB',
    ext: 'EXE',
    color: 'from-blue-600 to-blue-800',
    glow: 'rgba(59,130,246,0.3)',
    borderColor: 'border-blue-700/30',
    badge2: 'Windows 10/11',
    filename: 'SAION-AI-Setup-v1.0.1.exe',
    directLink: `${GITHUB_BASE}/SAION-AI-Setup-v1.0.1.exe`,
    description: 'Full desktop experience. Supports Windows 10 and Windows 11, both 64-bit.',
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: <Terminal size={28} />,
    badge: 'v1.0.1',
    size: '134 MB',
    ext: 'AppImage',
    color: 'from-orange-600 to-amber-700',
    glow: 'rgba(245,158,11,0.3)',
    borderColor: 'border-amber-700/30',
    badge2: 'All Linux Distros',
    filename: 'SAION-AI-v1.0.1.AppImage',
    directLink: `${GITHUB_BASE}/SAION-AI-v1.0.1.AppImage`,
    description: 'Universal AppImage format — runs on all major Linux distributions without installation.',
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu / Debian',
    icon: <Terminal size={28} />,
    badge: 'v1.0.1',
    size: '80.5 MB',
    ext: 'DEB',
    color: 'from-purple-600 to-violet-700',
    glow: 'rgba(124,58,237,0.3)',
    borderColor: 'border-violet-700/30',
    badge2: 'Ubuntu / Debian / Mint',
    filename: 'SAION-AI-v1.0.1.deb',
    directLink: `${GITHUB_BASE}/SAION-AI-v1.0.1.deb`,
    description: 'Native .deb package for Ubuntu, Debian, and Linux Mint. Installs with a double click.',
  },
]

const features = [
  { icon: <Zap size={16} />, text: 'Lightning fast AI responses' },
  { icon: <Shield size={16} />, text: 'Private & encrypted chats' },
  { icon: <Globe size={16} />, text: 'Works in 50+ languages' },
  { icon: <Star size={16} />, text: 'Video editing & image generation' },
]

export default function DownloadPage() {
  const [downloaded, setDownloaded] = useState<string | null>(null)

  const handleDownload = (platform: typeof platforms[0]) => {
    const a = document.createElement('a')
    a.href = platform.directLink
    a.download = platform.filename
    a.click()
    setDownloaded(platform.id)
    setTimeout(() => setDownloaded(null), 3000)
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-900/10 blur-[120px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(124,58,237,0.8) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-5">
            <SaionLogo size={80} animated />
          </div>
          <h1 className="font-display text-5xl font-bold mb-3">
            Download <span className="gradient-text">SAION AI</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Take your AI assistant everywhere. Available for Android, Windows, and Linux.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400 bg-[#0e0e0e] border border-[#1a1a1a] rounded-full px-4 py-2">
                <span className="text-violet-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Download Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {platforms.map(platform => (
            <div
              key={platform.id}
              className={`relative bg-[#0a0a0a] border ${platform.borderColor} rounded-2xl p-6 flex flex-col hover:scale-[1.02] transition-transform duration-300`}
              style={{ boxShadow: `0 0 40px ${platform.glow}20` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4 shadow-lg`}
                style={{ boxShadow: `0 0 20px ${platform.glow}` }}>
                {platform.icon}
              </div>

              <h3 className="font-display font-bold text-xl text-white mb-1">{platform.name}</h3>
              <span className="text-xs text-gray-600 mb-1">{platform.badge2}</span>

              <p className="text-gray-500 text-sm mt-2 mb-5 flex-1">{platform.description}</p>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-gray-600">Version {platform.badge}</span>
                  <span className="text-gray-700 mx-1.5">·</span>
                  <span className="text-xs text-gray-600">{platform.size}</span>
                </div>
                <span className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full text-gray-400 font-mono">
                  .{platform.ext.toLowerCase()}
                </span>
              </div>

              <button
                onClick={() => handleDownload(platform)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r ${platform.color} text-white hover:opacity-90`}
                style={{ boxShadow: `0 0 15px ${platform.glow}` }}
              >
                {downloaded === platform.id ? (
                  <><Check size={16} /> Downloaded!</>
                ) : (
                  <><Download size={16} /> Download for {platform.name}</>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-7 mb-10">
          <h2 className="font-display font-bold text-xl text-white mb-5">Installation Guide</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center">
                  <Smartphone size={16} className="text-emerald-400" />
                </div>
                <span className="font-semibold text-white">Android</span>
              </div>
              <ol className="space-y-1.5 text-sm text-gray-500">
                <li>1. Download the APK file</li>
                <li>2. Go to Settings → Security</li>
                <li>3. Enable "Unknown Sources"</li>
                <li>4. Open the APK and install</li>
                <li>5. Launch SAION AI</li>
              </ol>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-700/30 flex items-center justify-center">
                  <Monitor size={16} className="text-blue-400" />
                </div>
                <span className="font-semibold text-white">Windows</span>
              </div>
              <ol className="space-y-1.5 text-sm text-gray-500">
                <li>1. Download the .exe installer</li>
                <li>2. Run the setup file</li>
                <li>3. Click "Install" when prompted</li>
                <li>4. Allow permissions if asked</li>
                <li>5. Launch from Desktop</li>
              </ol>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-900/40 border border-amber-700/30 flex items-center justify-center">
                  <Terminal size={16} className="text-amber-400" />
                </div>
                <span className="font-semibold text-white">Linux</span>
              </div>
              <ol className="space-y-1.5 text-sm text-gray-500">
                <li>1. Download the AppImage</li>
                <li>2. Make it executable:</li>
                <li className="font-mono text-xs bg-[#111] px-2 py-1 rounded">chmod +x SAION-AI.AppImage</li>
                <li>3. Run: ./SAION-AI.AppImage</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-sm">
          © 2005–2026 Saion Production · All rights reserved · <a href="#" className="text-violet-500 hover:text-violet-400">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
