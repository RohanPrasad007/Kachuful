# Kachuful

A real-time multiplayer trick-taking card game built with Next.js and Node.js + Socket.io.

## Architecture

- **Frontend**: Next.js App Router. Deployed on Vercel.
- **Backend**: Node.js, Express, Socket.io. Deployed on Render / Fly.io.

## Local Development Setup

### 1. Backend

```bash
cd server
npm install
npm run dev # (or just node index.js)
```

The server will run on `http://localhost:3001`.

### 2. Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The client will run on `http://localhost:3000`.

## Environment Variables

### Frontend (`client/.env.local`)

When deploying the frontend to Vercel, you must set the following environment variable to point to your live backend server:

```
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.onrender.com
```

### Backend (`server/.env`)

Optional. You can define `PORT` if your hosting provider requires it, though Render/Fly.io generally pass this automatically.
