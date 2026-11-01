# 🚀 TuneClash Deployment Guide

TuneClash is segregated into two clean, self-contained directories:
1. **Frontend Web App (`frontend/`)**: Next.js 14 + Tailwind CSS (Deploy on **Vercel**).
2. **Backend Server (`backend/`)**: Node.js + Express + Socket.IO (Deploy on **Render**, **Railway**, or **Fly.io**).

---

## 1. Deploy Frontend on Vercel (Recommended)

### Step 1: Push Code to GitHub
```bash
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your `tune-clash` repository.
4. In the Project Configuration:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build` (default)
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

Because Vercel serverless functions do not support long-lived WebSocket connections, the game server runs best on a persistent container platform like **Railway** or **Render**.

### Option A: Railway (Smoothest - No Cold Starts)
1. Go to [railway.app](https://railway.app) and click **"New Project" ➔ "Deploy from GitHub repo"**.
2. Select your `tune-clash` repo.
3. In service settings:
   - Set **Root Directory** to `backend`.
   - Set environment variable `PORT` to `${{PORT}}` (or `4000`).
   - Add `ALLOWED_ORIGIN` set to your Vercel URL (e.g. `https://your-tuneclash.vercel.app`).
   - *(Optional)* Add `MONGODB_URI` from MongoDB Atlas (or leave empty to use instant in-memory DB).
4. Click **Deploy**!

### Option B: Render (Free Web Service)
1. Go to [render.com](https://render.com) and click **"New +" ➔ "Web Service"**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `4000` (or Render default)
     - `ALLOWED_ORIGIN`: `https://your-tuneclash.vercel.app` (your Vercel frontend URL)
     - `MONGODB_URI`: *(Optional)* Your MongoDB Atlas URI. If omitted, the server will automatically use an in-memory database for quick ephemeral play!

---

## 3. Production Readiness Checklist

- [x] **Segregated Architecture**: `frontend/` and `backend/` are 100% self-contained with no private cross-package linking issues.
- [x] **Cross-Origin Security & CORS**: Server allows cross-origin requests from both localhost and any Vercel domain with preflight caching.
- [x] **Audio Streaming**: `Range` and `Accept-Ranges` headers exposed with gzip compression.
- [x] **Zero Hardcoded URLs**: Client dynamically loads API & Socket endpoints from `apiConfig.ts`.
- [x] **1,065 Songs Catalog**: Populated with authentic Bollywood & Hollywood tracks.
- [x] **Full Test Suite**: Tested with 0 errors across unit and integration tests.
