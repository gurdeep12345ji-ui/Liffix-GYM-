# LIFFIX GYM AI — Setup Guide

## 🚀 Quick Start

### 1. Open the website
Just open `index.html` in any browser. It works immediately in demo mode — no backend needed.

**Demo logins** (click "Login" → "Demo User Login" or "Demo Admin Login"):
- Demo User → full fitness app access
- Demo Admin → full admin panel with CEO dashboard, team management, analytics

---

## 🔧 Connect Your Own Supabase (Optional — for real user accounts)

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to SQL Editor → paste contents of `supabase/schema.sql` → Run
3. In Supabase: Project Settings → API → copy **URL** and **anon key**
4. Login as Demo Admin → AI Settings → paste Supabase URL + Key → Save

---

## 🤖 Connect OpenAI (for live AI Coach responses)

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Login as Demo Admin → AI Settings → paste your OpenAI key → Save
3. Or: paste it directly in the AI Coach section (user side)

---

## 👥 Admin Panel — Roles

| Role | Access |
|------|--------|
| CEO | Full access to everything |
| Director | Users, analytics, team |
| R&D | AI settings, feature planning |
| Coder | GitHub/deploy, file manager |
| Building | Feature deployment |
| Thinker | Campaign planning |
| Graphic Designer | Promoter section |
| Video Designer | Social media assets |
| Error Searcher | Error log, scan & fix |
| Rebuild Specialist | Rebuild request system |
| Promoter | Social media, campaigns |
| Advisor | Analytics, strategy |

**To create team accounts:**
Admin Panel → Team → Add Team Member → set role + email + password

---

## 📁 File Structure

```
liffix/
├── index.html          ← Main app (all pages)
├── styles/
│   └── main.css        ← All styles (dark theme, neon green)
├── scripts/
│   └── app.js          ← All JavaScript logic
└── supabase/
    └── schema.sql      ← Database schema (run in Supabase)
```

---

## 🌐 Deploy to GitHub + Vercel/Netlify

1. Create GitHub repo: `github.com/new`
2. Push files: `git init && git add . && git commit -m "LIFFIX launch" && git push`
3. Go to [vercel.com](https://vercel.com) → Import repo → Deploy
4. Your site is live at `https://liffix.vercel.app`

---

## 📱 Features Summary

### User App
- ✅ Landing page with locked feature preview
- ✅ Register / Login (Supabase or demo)
- ✅ Dashboard — calories, macros, water, progress chart
- ✅ Profile — BMI, TDEE, personalized AI analysis
- ✅ AI Meal Planner — 4 meals per day, muscle gain / fat loss / maintain
- ✅ Diet Tracker — log meals, food photo AI scan, macro dashboard
- ✅ Supplement Analyzer — 12+ supplements with full data
- ✅ Budget Planner — AI-optimized food + supplement plan
- ✅ Workout Plan — beginner / intermediate / advanced 7-day programs
- ✅ AI Coach — GPT-powered chat, works offline with fallback
- ✅ Pricing — Free / $9.99 / $19.99 / $49.99 plans
- ✅ Water tracker — 8-glass daily tracking
- ✅ Mobile responsive — fully mobile-first
- ✅ Multi-language — English + Arabic (RTL)

### Admin Panel
- ✅ CEO/Director/Team role system
- ✅ User management — all users, IP, location, session time
- ✅ Live activity chart — hourly user activity
- ✅ Analytics — DAU, top searches, locations, device types
- ✅ Team management — add/manage 12 role types
- ✅ AI settings — OpenAI + Supabase config
- ✅ GitHub/Deploy — pipeline, rollback, file manager
- ✅ Promoter — social media, viral campaign generator (AI)
- ✅ Error scanner + AI auto-fix
- ✅ Rebuild request system

---

## ⚙️ Customization

Change neon color: In `styles/main.css`, replace `#00ff88` with any color  
Change site name: In `index.html`, replace `LIFFIX GYM AI`  
Add more foods: In `scripts/app.js`, add to `FOOD_DB` array  
Add more supplements: Add to `SUPPLEMENT_DB` array  

---

© 2025 LIFFIX GYM AI — Built for Champions 💪
