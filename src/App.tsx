import React, { useEffect } from 'react'
import { Shield } from 'lucide-react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import LoginPage from './components/Auth/LoginPage'
import Sidebar from './components/Sidebar/Sidebar'
import ChatWindow from './components/Chat/ChatWindow'
import DownloadPage from './pages/DownloadPage'
import DemoPage from './pages/DemoPage'
import AdminPage from './pages/AdminPage'
import SaionLogo from './components/UI/SaionLogo'

// ─── Detect if running inside Electron or Capacitor (installed app) ───────────
const isElectron = !!(
  typeof window !== 'undefined' &&
  (window as any).electronAPI?.isElectron === true
)

const isCapacitor = !!(
  typeof window !== 'undefined' && (
    (window as any).Capacitor?.isNativePlatform?.() ||
    // Fallback: check if running on Android via user agent when Capacitor not yet ready
    (typeof navigator !== 'undefined' &&
     /android/i.test(navigator.userAgent) &&
     window.location.protocol !== 'http:' &&
     window.location.protocol !== 'https:')
  )
)

export const isInstalledApp = isElectron || isCapacitor

// ─── Full chat app layout (shown after login) ─────────────────────────────────
function AppLayout() {
  const { currentUser, loading, userProfile, isBanned, banReason } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <SaionLogo size={56} animated />
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  // Banned user
  if (isBanned) {
    return (
      <div className="flex items-center justify-center h-screen bg-black px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-700/30 flex items-center justify-center mx-auto mb-5">
            <Shield size={28} className="text-red-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Account Suspended</h2>
          <p className="text-gray-500 text-sm mb-4">{banReason || 'Your account has been suspended.'}</p>
          <p className="text-gray-700 text-xs">Contact support if you believe this is a mistake.</p>
        </div>
      </div>
    )
  }

  // Owner → admin panel
  if (currentUser?.email === 'sakethtransformers@gmail.com') {
    return <Navigate to="/admin" replace />
  }

  // Not logged in → show Login page
  if (!currentUser) return <LoginPage />

  // Logged in → show full chat
  return (
    <ChatProvider>
      <AppInner userProfile={userProfile} />
    </ChatProvider>
  )
}

function AppInner({ userProfile }: { userProfile: ReturnType<typeof useAuth>['userProfile'] }) {
  const isExpired =
    userProfile?.isPaid &&
    userProfile.subscriptionExpiry &&
    new Date(userProfile.subscriptionExpiry) < new Date()

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {isExpired && (
        <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 px-4 py-2.5 bg-amber-900/90 backdrop-blur-sm border-b border-amber-700/50">
          <span className="text-amber-200 text-sm font-medium">
            ⚠️ Your SAION AI Pro subscription has expired.
          </span>
          <button className="shimmer-btn text-white text-xs px-3 py-1 rounded-lg font-semibold">
            Renew Now
          </button>
        </div>
      )}
      <Sidebar />
      <ChatWindow />
    </div>
  )
}

// ─── Routes for INSTALLED app (Electron / Android APK) ───────────────────────
// Only shows Login → Chat. No DownloadPage, no Demo.
function InstalledAppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* /app is the entry point loaded by Electron main.js (hash: '/app') */}
        <Route path="/app" element={<AppLayout />} />
        {/* /chat also works as alias */}
        <Route path="/chat" element={<AppLayout />} />
        {/* Everything else → /app */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </AuthProvider>
  )
}

// ─── Routes for WEBSITE (saion-ai.netlify.app) ───────────────────────────────
// Shows Download Hub at /, Demo at /try, Chat at /chat
function WebsiteRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Landing page = Download Hub */}
        <Route path="/" element={<DownloadPage />} />
        <Route path="/download" element={<DownloadPage />} />
        {/* Demo chat — limited 8 messages */}
        <Route path="/try" element={<DemoPage />} />
        {/* Full chat — requires login */}
        <Route path="/chat" element={<AppLayout />} />
        <Route path="/admin" element={<AppLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  if (isInstalledApp) {
    // Electron uses file:// protocol → HashRouter is required
    // Capacitor also benefits from HashRouter
    return (
      <HashRouter>
        <InstalledAppRoutes />
      </HashRouter>
    )
  }

  // Web: normal BrowserRouter
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WebsiteRoutes />
    </BrowserRouter>
  )
}
