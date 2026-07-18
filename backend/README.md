# SAION AI — Media Backend

Handles **Spotify search** (via Client Credentials — Client Secret stays server-side)
and provides **YouTube search URLs** (no API key needed).

## Setup

```bash
cd backend
npm install
# .env is already created with your credentials
npm start
```

Runs on: `http://localhost:5000`

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /spotify?q=kesariya` | Search Spotify, returns real trackId + embed URL |
| `GET /health` | Health check |

## Environment Variables (`backend/.env`)

| Key | Description |
|---|---|
| `SPOTIFY_CLIENT_ID` | From Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | **Never expose to frontend** |
| `PORT` | Default: 5000 |

## Production Deployment

Deploy the `backend/` folder to any Node.js host (Railway, Render, Fly.io, etc.).

Then update in your frontend `.env`:
```
VITE_MEDIA_BACKEND_URL=https://your-backend-url.railway.app
```

## Security Notes

- ✅ Client Secret is NEVER sent to the frontend
- ✅ No `VITE_` prefix on secrets
- ✅ CORS restricts allowed origins
- ✅ Token is cached and reused until expiry
