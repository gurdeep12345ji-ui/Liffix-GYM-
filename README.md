# 🤖 My Learning AI

An AI agent that learns from the internet using **only free APIs** — no paid services, no credit card needed.

## ✨ Features

- 🌐 Searches internet using **8 FREE APIs** in parallel
- 📚 Learns from Jina, Tavily, Wikipedia, HackerNews, GitHub, Stack Overflow, arXiv, SearXNG
- ✋ Asks YOUR approval before saving anything
- 💾 Saves to JSONL brain file
- 📱 Works 100% on phone
- 🎨 Beautiful dark UI
- 🔴 Live activity view shows what AI is doing in real-time

## 🚀 Quick Deploy (3 options, all FREE)

### Option 1: Koyeb (BEST — always on, no sleep)

1. Push this folder to GitHub
2. Go to [koyeb.com](https://koyeb.com) (no credit card!)
3. New app → connect GitHub repo
4. Click Deploy. Done.

Your AI is live 24/7 at `yourapp.koyeb.app`

### Option 2: Render (free with sleep)

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. New Web Service → connect repo
4. Build: `npm install`, Start: `npm start`

### Option 3: Replit

1. Create new Repl → Import from GitHub
2. Hit Run
3. Copy the URL it gives you

## 🔑 Optional API Keys (all free, no credit card)

Add these in your `.env` or platform's env settings for better performance:

```
JINA_KEY=          # jina.ai - 10M tokens free
TAVILY_KEY=        # tavily.com - 1000 searches/month  
GEMINI_KEY=        # aistudio.google.com - 1000 req/day
GROQ_KEY=          # console.groq.com - 14,400 req/day
GH_TOKEN=          # github.com/settings/tokens - 5000/hour
```

**The app works WITHOUT any keys** — it just uses fewer rate limits with them.

## 📱 How to use

1. Open your deployed URL on phone
2. Go to **Learn tab** → type any topic (e.g. "React hooks")
3. Go to **Approve tab** → review what AI found
4. Approve or reject each finding
5. Go to **Chat tab** → ask your AI questions
6. Check **Live tab** to watch what AI is doing
7. **Settings → Download brain.jsonl** anytime

## 🧠 How it works

```
You ask to learn a topic
    ↓
AI queries 4+ free APIs in parallel
    ↓
Results dedupled & ranked by source quality
    ↓
Shown to you for approval
    ↓
You approve → saved to brain.jsonl
    ↓
AI gets smarter every day
```

## 🛠️ Local development

```bash
npm install
cp .env.example .env
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Data files

- `data/brain.jsonl` — Your approved knowledge (export anytime)
- `data/pending.json` — Items awaiting your approval  
- `data/logs.json` — Activity history

## 🎯 Why not Glitch?

Glitch shut down hosting July 2025. Use Koyeb, Render, Fly.io, or Replit instead.

---

Built with free APIs. No paid services. Works on phone. Grows every day. 🌱
