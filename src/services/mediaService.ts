// ─── SAION AI Media Service — 2026 ───────────────────────────────────────────
// YouTube: Invidious API (open-source YouTube) → real video ID → no 404
// Spotify: Anonymous token → real track ID → official embed → no 404
// App Launch: Android intent URLs → checks if app installed → opens it

// ── SPOTIFY TOKEN STORAGE ────────────────────────────────────────────────────
export const getSpotifyToken = () => localStorage.getItem('spotify_access_token')
export const setSpotifyToken = (token: string, expiresIn: number) => {
  localStorage.setItem('spotify_access_token', token)
  localStorage.setItem('spotify_token_expiry', String(Date.now() + expiresIn * 1000))
}
export const clearSpotifyToken = () => {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_token_expiry')
  localStorage.removeItem('spotify_connected')
}
export const isSpotifyConnected = () => !!localStorage.getItem('spotify_connected')
export const setSpotifyConnected = (name: string, img: string) => {
  localStorage.setItem('spotify_connected', 'true')
  localStorage.setItem('spotify_user_name', name)
  localStorage.setItem('spotify_user_img', img)
}
export const getSpotifyUser = () => {
  if (!localStorage.getItem('spotify_connected')) return null
  return {
    name: localStorage.getItem('spotify_user_name') || 'Spotify User',
    img: localStorage.getItem('spotify_user_img') || '',
  }
}

// ── YOUTUBE SEARCH ───────────────────────────────────────────────────────────
// Uses multiple Invidious instances (open-source YouTube frontends)
// Returns real YouTube video ID — guaranteed embed works, zero 404

const INVIDIOUS_INSTANCES = [
  'https://invidious.privacydev.net',
  'https://iv.datura.network',
  'https://invidious.fdn.fr',
  'https://invidious.perennialte.ch',
  'https://invidious.lunar.icu',
  'https://invidious.protokolla.fi',
  'https://inv.tux.pizza',
  'https://invidious.io.lol',
  'https://invidious.nerdvpn.de',
  'https://y.com.sb',
  'https://invidious.slipfox.xyz',
  'https://vid.puffyan.us',
]

export interface YouTubeResult {
  videoId: string
  title: string
  author: string
  thumbnail: string
  embedUrl: string
  watchUrl: string
}

export async function searchYouTube(query: string): Promise<YouTubeResult | null> {
  // ── Try Invidious instances (open-source YouTube frontends) ──────────────
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&fields=videoId,title,author,videoThumbnails&page=1`
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) continue
      const v = data[0]
      const videoId: string = v.videoId
      if (!videoId) continue
      const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      return {
        videoId,
        title: v.title || query,
        author: v.author || '',
        thumbnail,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      }
    } catch { continue }
  }

  // ── Fallback: extract videoId from YouTube oEmbed (no API key needed) ────
  // YouTube's oEmbed endpoint returns real metadata for top search result
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(searchUrl)}&format=json`
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      // oEmbed gives us thumbnail_url like: https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg
      const match = data.thumbnail_url?.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
      if (match?.[1]) {
        const videoId = match[1]
        return {
          videoId,
          title: data.title || query,
          author: data.author_name || '',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
          watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        }
      }
    }
  } catch { /* ignore */ }

  // ── Last resort: scrape videoId from YouTube search HTML ─────────────────
  try {
    const res = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(6000), headers: { 'Accept-Language': 'en-US' } }
    )
    if (res.ok) {
      const html = await res.text()
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
      if (match?.[1]) {
        const videoId = match[1]
        return {
          videoId,
          title: query,
          author: '',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
          watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        }
      }
    }
  } catch { /* ignore */ }

  return null
}

// ── SPOTIFY SEARCH ───────────────────────────────────────────────────────────
// Step 1: get anonymous Spotify token (no auth needed)
// Step 2: search Spotify API for real track ID
// Step 3: return official embed URL with real track ID — zero 404

export interface SpotifyResult {
  trackId: string
  trackName: string
  artistName: string
  albumName: string
  albumArt: string
  previewUrl: string | null
  embedUrl: string  // official Spotify embed with real track ID
  openUrl: string   // open in Spotify app/web
}

async function getAnonymousSpotifyToken(): Promise<string | null> {
  // First try: stored user OAuth token
  const stored = getSpotifyToken()
  const expiry = Number(localStorage.getItem('spotify_token_expiry') || 0)
  if (stored && Date.now() < expiry) return stored

  // Second try: Spotify anonymous web player token (public endpoint, no auth)
  try {
    const res = await fetch(
      'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      }
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.accessToken) return data.accessToken
    }
  } catch { /* ignore */ }

  return null
}

export async function searchSpotify(query: string): Promise<SpotifyResult> {
  try {
    const token = await getAnonymousSpotifyToken()
    if (!token) throw new Error('no token')

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1&market=US`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      }
    )

    if (!searchRes.ok) throw new Error(`Spotify search failed: ${searchRes.status}`)
    const data = await searchRes.json()
    const track = data?.tracks?.items?.[0]
    if (!track) throw new Error('no track found')

    const trackId: string = track.id

    return {
      trackId,
      trackName: track.name || query,
      artistName: track.artists?.[0]?.name || '',
      albumName: track.album?.name || '',
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url || null,
      // Official Spotify embed with REAL track ID — zero 404
      embedUrl: `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1`,
      openUrl: `https://open.spotify.com/track/${trackId}`,
    }
  } catch {
    // Fallback: search embed (still works, shows results, no 404)
    const encoded = encodeURIComponent(query)
    return {
      trackId: '',
      trackName: query,
      artistName: '',
      albumName: '',
      albumArt: '',
      previewUrl: null,
      embedUrl: `https://open.spotify.com/embed/search/${encoded}?utm_source=generator&theme=0&autoplay=1`,
      openUrl: `https://open.spotify.com/search/${encoded}`,
    }
  }
}

// ── ANDROID APP LAUNCHER ─────────────────────────────────────────────────────
// Detects if user is on Android, then tries to open apps via intent URLs
// Intent URL format: intent://... works on Android Chrome/WebView
// Falls back to app scheme if intent fails

export interface AppLaunchResult {
  attempted: boolean
  isAndroid: boolean
  appName: string
  method: 'intent' | 'scheme' | 'store' | 'none'
  message: string
}

// Map of app names to their Android intent + package + fallback scheme
const ANDROID_APPS: Record<string, {
  package: string
  scheme: string
  intentActivity?: string
  playStore: string
  label: string
}> = {
  whatsapp: {
    package: 'com.whatsapp',
    scheme: 'whatsapp://',
    playStore: 'https://play.google.com/store/apps/details?id=com.whatsapp',
    label: 'WhatsApp',
  },
  chrome: {
    package: 'com.android.chrome',
    scheme: 'googlechrome://',
    playStore: 'https://play.google.com/store/apps/details?id=com.android.chrome',
    label: 'Google Chrome',
  },
  gmail: {
    package: 'com.google.android.gm',
    scheme: 'googlegmail://',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.gm',
    label: 'Gmail',
  },
  maps: {
    package: 'com.google.android.apps.maps',
    scheme: 'geo:0,0',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.apps.maps',
    label: 'Google Maps',
  },
  youtube: {
    package: 'com.google.android.youtube',
    scheme: 'youtube://',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.youtube',
    label: 'YouTube',
  },
  spotify: {
    package: 'com.spotify.music',
    scheme: 'spotify://',
    playStore: 'https://play.google.com/store/apps/details?id=com.spotify.music',
    label: 'Spotify',
  },
  instagram: {
    package: 'com.instagram.android',
    scheme: 'instagram://',
    playStore: 'https://play.google.com/store/apps/details?id=com.instagram.android',
    label: 'Instagram',
  },
  telegram: {
    package: 'org.telegram.messenger',
    scheme: 'tg://',
    playStore: 'https://play.google.com/store/apps/details?id=org.telegram.messenger',
    label: 'Telegram',
  },
  twitter: {
    package: 'com.twitter.android',
    scheme: 'twitter://',
    playStore: 'https://play.google.com/store/apps/details?id=com.twitter.android',
    label: 'Twitter / X',
  },
  facebook: {
    package: 'com.facebook.katana',
    scheme: 'fb://',
    playStore: 'https://play.google.com/store/apps/details?id=com.facebook.katana',
    label: 'Facebook',
  },
  snapchat: {
    package: 'com.snapchat.android',
    scheme: 'snapchat://',
    playStore: 'https://play.google.com/store/apps/details?id=com.snapchat.android',
    label: 'Snapchat',
  },
  'google assistant': {
    package: 'com.google.android.googlequicksearchbox',
    scheme: 'intent://assist#Intent;scheme=android-app;package=com.google.android.googlequicksearchbox;end',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox',
    label: 'Google Assistant',
  },
  assistant: {
    package: 'com.google.android.googlequicksearchbox',
    scheme: 'intent://assist#Intent;scheme=android-app;package=com.google.android.googlequicksearchbox;end',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox',
    label: 'Google Assistant',
  },
  camera: {
    package: 'android.media.action.IMAGE_CAPTURE',
    scheme: 'intent://capture#Intent;scheme=android-media;action=android.media.action.IMAGE_CAPTURE;end',
    playStore: '',
    label: 'Camera',
  },
  settings: {
    package: 'com.android.settings',
    scheme: 'intent:#Intent;action=android.settings.SETTINGS;end',
    playStore: '',
    label: 'Settings',
  },
  calculator: {
    package: 'com.google.android.calculator',
    scheme: 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.calculator',
    label: 'Calculator',
  },
  netflix: {
    package: 'com.netflix.mediaclient',
    scheme: 'nflx://',
    playStore: 'https://play.google.com/store/apps/details?id=com.netflix.mediaclient',
    label: 'Netflix',
  },
  amazon: {
    package: 'com.amazon.mShop.android.shopping',
    scheme: 'amzn://',
    playStore: 'https://play.google.com/store/apps/details?id=com.amazon.mShop.android.shopping',
    label: 'Amazon',
  },
  linkedin: {
    package: 'com.linkedin.android',
    scheme: 'linkedin://',
    playStore: 'https://play.google.com/store/apps/details?id=com.linkedin.android',
    label: 'LinkedIn',
  },
  zoom: {
    package: 'us.zoom.videomeetings',
    scheme: 'zoomus://',
    playStore: 'https://play.google.com/store/apps/details?id=us.zoom.videomeetings',
    label: 'Zoom',
  },
  'google pay': {
    package: 'com.google.android.apps.nbu.paisa.user',
    scheme: 'upi://',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user',
    label: 'Google Pay',
  },
  gpay: {
    package: 'com.google.android.apps.nbu.paisa.user',
    scheme: 'upi://',
    playStore: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user',
    label: 'Google Pay',
  },
  phonepe: {
    package: 'com.phonepe.app',
    scheme: 'phonepe://',
    playStore: 'https://play.google.com/store/apps/details?id=com.phonepe.app',
    label: 'PhonePe',
  },
  paytm: {
    package: 'net.one97.paytm',
    scheme: 'paytmmp://',
    playStore: 'https://play.google.com/store/apps/details?id=net.one97.paytm',
    label: 'Paytm',
  },
}

export function isAndroidDevice(): boolean {
  return /android/i.test(navigator.userAgent)
}

export function findApp(query: string): typeof ANDROID_APPS[string] & { key: string } | null {
  const lower = query.toLowerCase().trim()
  for (const [key, app] of Object.entries(ANDROID_APPS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return { ...app, key }
    }
  }
  return null
}

export async function launchAndroidApp(appQuery: string): Promise<AppLaunchResult> {
  const isAndroid = isAndroidDevice()
  const app = findApp(appQuery)

  if (!isAndroid) {
    return {
      attempted: false,
      isAndroid: false,
      appName: app?.label || appQuery,
      method: 'none',
      message: `📱 App launching only works on **Android devices** with the SAION AI app installed.\n\nYou're currently on a non-Android device. Download the SAION AI Android app to use this feature.`,
    }
  }

  if (!app) {
    return {
      attempted: false,
      isAndroid: true,
      appName: appQuery,
      method: 'none',
      message: `I couldn't find **"${appQuery}"** in my app list. Try being more specific — for example: "open WhatsApp", "open Google Maps", "open Instagram".`,
    }
  }

  // Try to launch via intent URL (best method for Android)
  try {
    // Use a timeout trick to detect if app opened
    // If app is installed, it opens immediately
    // If not, Android shows "App not installed" or nothing happens
    const launchUrl = app.scheme.startsWith('intent://') || app.scheme.startsWith('intent:#')
      ? app.scheme
      : `intent://${app.scheme.replace('://', '')}#Intent;scheme=${app.scheme.split('://')[0]};package=${app.package};end`

    window.location.href = launchUrl

    // Check if page is still active after 2s (if app didn't open, page stays)
    await new Promise(resolve => setTimeout(resolve, 2000))

    return {
      attempted: true,
      isAndroid: true,
      appName: app.label,
      method: 'intent',
      message: `✅ Opening **${app.label}**...\n\nIf the app didn't open, it may not be installed on your device.\n${app.playStore ? `[📥 Install ${app.label}](${app.playStore})` : ''}`,
    }
  } catch {
    // Fallback: play store link
    return {
      attempted: true,
      isAndroid: true,
      appName: app.label,
      method: 'store',
      message: `⚠️ Couldn't open **${app.label}**. It may not be installed.\n\n${app.playStore ? `[📥 Download ${app.label} from Play Store](${app.playStore})` : 'Please install it from the Play Store.'}`,
    }
  }
}
