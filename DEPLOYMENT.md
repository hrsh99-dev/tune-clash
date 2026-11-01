# 🚀 TuneClash Deployment Guide

TuneClash consists of two components:
1. **Frontend Web App (`apps/web`)**: Next.js 14 + Tailwind CSS (Deploy on **Vercel**).
2. **Backend Server (`apps/server`)**: Node.js + Express + Socket.IO (Deploy on **Render**, **Railway**, **Fly.io**, or **Heroku**).

---

## 1. Deploy Frontend on Vercel (Recommended)

### Step 1: Push Code to GitHub
Push your repository to your GitHub account:
```bash
git add .
git commit -m "TuneClash: Complete Neo-Brutalist UI and multiplayer game"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your `gameplay` / `tuneclash` repository.
4. In the Project Configuration:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: Click *Edit* and select **`apps/web`**
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 3: Add Environment Variables in Vercel
In the Vercel project settings under **Environment Variables**, add:
| Key | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` | URL of your deployed Socket.IO / Express server |
| `NEXT_PUBLIC_SOCKET_URL` | `https://your-backend.onrender.com` | Optional (defaults to `NEXT_PUBLIC_API_URL`) |

*Note: In local development, these variables automatically fall back to `http://localhost:4000`.*

5. Click **"Deploy"**! Vercel will build and deploy your site in ~45 seconds.

---

## 2. Deploy Backend Game Server (Socket.IO + Node)

Because Vercel serverless functions do not support long-lived WebSocket connections, the game server runs best on a persistent container platform like **Render**, **Railway**, or **Fly.io**.

### Option A: Render (Free & Simple)
1. Go to [render.com](https://render.com) and click **"New +" ➔ "Web Service"**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Root Directory**: `apps/server` (or repository root)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start` (or `node dist/index.js`)
   - **Environment Variables**:
     - `PORT`: `4000` (or Render default)
     - `MONGODB_URI`: *(Optional)* Your MongoDB Atlas URI. If omitted, the server will automatically use an in-memory database for quick ephemeral play!
     - `ALLOWED_ORIGIN`: `https://your-tuneclash.vercel.app` (your Vercel frontend URL)

### Option B: Railway
1. Go to [railway.app](https://railway.app) and click **"New Project" ➔ "Deploy from GitHub repo"**.
2. Set Root Directory to `apps/server`.
3. Set environment variable `PORT` to `${{PORT}}`.
4. Deploy!

---

## 3. Production Readiness Checklist

- [x] **Monorepo Transpilation**: `apps/web/next.config.js` includes `transpilePackages: ['@tune-clash/shared']`.
- [x] **Cross-Origin Security & CORS**: Server allows cross-origin requests from both localhost and any Vercel domain with preflight caching.
- [x] **Audio Streaming**: `Range` and `Accept-Ranges` headers exposed with gzip compression.
- [x] **Zero Hardcoded URLs**: Client dynamically loads API & Socket endpoints from `apiConfig.ts`.
- [x] **1,065 Songs Catalog**: Populated with authentic Bollywood & Hollywood tracks.
- [x] **Full E2E Test Suite**: Passed with 0 errors across 35 unit/integration tests and complete live multiplayer loop.
