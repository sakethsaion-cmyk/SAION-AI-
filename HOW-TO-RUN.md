# SAION AI — How to Run (Fixed Version)

## ✅ What was fixed:
.
1. **Image Generation** — Replaced Pollinations AI with **fal.ai flux.1 schnell** (completely free, no API key). Has smart retry + auto-fallback.
2. **CORS** — Backend now allows all origins so frontend can connect.

---

## 🚀 How to Run

### Step 1 — Start the Backend (REQUIRED for YouTube + Spotify)
```bash
cd backend
npm install
node server.js
```
Backend runs at: http://localhost:5000

Test it:
- http://localhost:5000/health
- http://localhost:5000/youtube?q=shape+of+you
- http://localhost:5000/spotify?q=kesariya

### Step 2 — Start the Frontend
```bash
# In the main project folder (not backend/)
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

Open http://localhost:5173 in Chrome.

---




## 🎨 Image Generation — flex.1 schnell
1. User types "generate image of a sunset"
2. Uses flux.1 schnell → no API key needed
3. Falls back to Pollinations AI if flux.1 schnell fails
4. Auto-retries up to 2 times if image fails to load
5. Shows spinner during generation, download button when done

---

## 🌐 Deploying (when submitting project)
- Frontend: Deploy to Vercel/Netlify (already has vercel.json + netlify.toml)
- Backend: Deploy to Railway/Render and update `BACKEND_URL` in `src/components/Chat/ChatWindow.tsx`
