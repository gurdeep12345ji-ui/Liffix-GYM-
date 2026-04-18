// ========================================================
// MY LEARNING AI - Full server
// Free APIs: Jina, Tavily, SearXNG, Wikipedia, HN, GitHub, arXiv
// Works on: Koyeb, Fly.io, Replit, Render (no Glitch - it died)
// ========================================================

import express from "express";
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import crypto from "node:crypto";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// ============ DATA FILES ============
const BRAIN_FILE = "./data/brain.jsonl";
const PENDING_FILE = "./data/pending.json";
const LOGS_FILE = "./data/logs.json";

// Create data folder on start
if (!fsSync.existsSync("./data")) fsSync.mkdirSync("./data");
if (!fsSync.existsSync(BRAIN_FILE)) fsSync.writeFileSync(BRAIN_FILE, "");
if (!fsSync.existsSync(PENDING_FILE)) fsSync.writeFileSync(PENDING_FILE, "[]");
if (!fsSync.existsSync(LOGS_FILE)) fsSync.writeFileSync(LOGS_FILE, "[]");

// ============ LOAD DATA ============
let brain = [];
let pending = [];
let logs = [];

function loadAll() {
  try {
    const lines = fsSync.readFileSync(BRAIN_FILE, "utf8").split("\n");
    brain = lines.filter(l => l.trim()).map(l => JSON.parse(l));
    pending = JSON.parse(fsSync.readFileSync(PENDING_FILE, "utf8"));
    logs = JSON.parse(fsSync.readFileSync(LOGS_FILE, "utf8"));
    console.log(`Loaded: ${brain.length} brain pairs, ${pending.length} pending`);
  } catch (e) {
    console.log("Load error:", e.message);
  }
}
loadAll();

// ============ SAVE FUNCTIONS ============
async function saveBrain() {
  const content = brain.map(p => JSON.stringify(p)).join("\n");
  await fs.writeFile(BRAIN_FILE, content);
}
async function savePending() {
  await fs.writeFile(PENDING_FILE, JSON.stringify(pending, null, 2));
}
async function saveLogs() {
  if (logs.length > 200) logs = logs.slice(0, 200);
  await fs.writeFile(LOGS_FILE, JSON.stringify(logs));
}

function addLog(type, message, extra = {}) {
  const log = {
    time: new Date().toISOString(),
    type,
    message,
    ...extra
  };
  logs.unshift(log);
  console.log(`[${type}] ${message}`);
  saveLogs();
}

// ============ KEYS (all optional, all free) ============
const KEYS = {
  jina: process.env.JINA_KEY || "",
  tavily: process.env.TAVILY_KEY || "",
  groq: process.env.GROQ_KEY || "",
  gemini: process.env.GEMINI_KEY || "",
  github: process.env.GH_TOKEN || ""
};

// ============ HELPERS ============
const SEARX_INSTANCES = [
  "https://searx.be",
  "https://priv.au",
  "https://search.ononoki.org",
  "https://searx.tiekoetter.com"
];
const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

async function timedFetch(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function hashId(str) {
  return crypto.createHash("sha1").update(str).digest("hex").slice(0, 12);
}

// ============ FREE SEARCH SOURCES ============

async function searchJina(query) {
  addLog("SEARCHING", `🌐 Jina AI: "${query}"`);
  const headers = { Accept: "application/json", "X-Respond-With": "no-content" };
  if (KEYS.jina) headers.Authorization = `Bearer ${KEYS.jina}`;
  const res = await timedFetch(
    `https://s.jina.ai/${encodeURIComponent(query)}`,
    { headers },
    10000
  );
  const json = await res.json();
  const results = (json.data || []).slice(0, 5).map(x => ({
    title: x.title || "Untitled",
    url: x.url,
    snippet: x.description || "",
    source: "jina"
  }));
  addLog("FOUND", `✅ Jina: ${results.length} results`);
  return results;
}

async function searchTavily(query) {
  if (!KEYS.tavily) {
    addLog("SKIP", "⏭️ Tavily (no key set)");
    return [];
  }
  addLog("SEARCHING", `🔍 Tavily: "${query}"`);
  const res = await timedFetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: KEYS.tavily,
      query,
      max_results: 5,
      search_depth: "basic"
    })
  });
  const json = await res.json();
  const results = (json.results || []).map(x => ({
    title: x.title,
    url: x.url,
    snippet: x.content,
    source: "tavily"
  }));
  addLog("FOUND", `✅ Tavily: ${results.length} results`);
  return results;
}

async function searchSearXNG(query) {
  addLog("SEARCHING", `🔎 SearXNG: "${query}"`);
  const instance = pickRandom(SEARX_INSTANCES);
  const res = await timedFetch(
    `${instance}/search?q=${encodeURIComponent(query)}&format=json`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  const json = await res.json();
  const results = (json.results || []).slice(0, 5).map(x => ({
    title: x.title,
    url: x.url,
    snippet: x.content || "",
    source: "searxng"
  }));
  addLog("FOUND", `✅ SearXNG: ${results.length} results`);
  return results;
}

async function searchWikipedia(query) {
  addLog("SEARCHING", `📚 Wikipedia: "${query}"`);
  const res = await timedFetch(
    `https://en.wikipedia.org/w/api.php?action=opensearch&limit=3&format=json&search=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": "MyLearningAI/1.0 (liffix@example.com)" } }
  );
  const data = await res.json();
  const [, titles, snippets, urls] = data;
  const results = titles.map((title, i) => ({
    title,
    url: urls[i],
    snippet: snippets[i] || "",
    source: "wikipedia"
  }));
  addLog("FOUND", `✅ Wikipedia: ${results.length} results`);
  return results;
}

async function searchHackerNews(query) {
  addLog("SEARCHING", `💻 Hacker News: "${query}"`);
  const res = await timedFetch(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story`
  );
  const json = await res.json();
  const results = (json.hits || []).slice(0, 5).map(x => ({
    title: x.title,
    url: x.url || `https://news.ycombinator.com/item?id=${x.objectID}`,
    snippet: (x.story_text || "").slice(0, 200),
    source: "hackernews"
  }));
  addLog("FOUND", `✅ HN: ${results.length} results`);
  return results;
}

async function searchGitHub(query) {
  addLog("SEARCHING", `🐙 GitHub: "${query}"`);
  const headers = {
    "User-Agent": "my-learning-ai",
    Accept: "application/vnd.github+json"
  };
  if (KEYS.github) headers.Authorization = `Bearer ${KEYS.github}`;
  const res = await timedFetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`,
    { headers }
  );
  const json = await res.json();
  const results = (json.items || []).map(x => ({
    title: x.full_name,
    url: x.html_url,
    snippet: x.description || `⭐ ${x.stargazers_count} stars · ${x.language || "Unknown"}`,
    source: "github"
  }));
  addLog("FOUND", `✅ GitHub: ${results.length} results`);
  return results;
}

async function searchStackOverflow(query) {
  addLog("SEARCHING", `❓ Stack Overflow: "${query}"`);
  const res = await timedFetch(
    `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow`
  );
  const json = await res.json();
  const results = (json.items || []).slice(0, 5).map(x => ({
    title: x.title,
    url: x.link,
    snippet: `Score: ${x.score} · ${x.answer_count} answers · Tags: ${x.tags.join(", ")}`,
    source: "stackoverflow"
  }));
  addLog("FOUND", `✅ SO: ${results.length} results`);
  return results;
}

async function searchArxiv(query) {
  addLog("SEARCHING", `📑 arXiv: "${query}"`);
  const res = await timedFetch(
    `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=5`
  );
  const text = await res.text();
  const $ = cheerio.load(text, { xmlMode: true });
  const results = [];
  $("entry").each((_, el) => {
    results.push({
      title: $(el).find("title").text().trim(),
      url: $(el).find("id").text().trim(),
      snippet: $(el).find("summary").text().trim().slice(0, 240),
      source: "arxiv"
    });
  });
  addLog("FOUND", `✅ arXiv: ${results.length} results`);
  return results;
}

// ============ SMART ROUTING ============
function routeQuery(query) {
  const q = query.toLowerCase();
  if (/\b(code|function|error|npm|python|javascript|git|api|stack)\b/.test(q)) return "code";
  if (/\b(news|today|latest|202[5-9]|recent)\b/.test(q)) return "news";
  if (/\b(paper|arxiv|research|study|scientific)\b/.test(q)) return "paper";
  if (/^(who|what|when|where|define)\b/.test(q)) return "facts";
  return "general";
}

const SEARCH_PLANS = {
  code: [searchGitHub, searchStackOverflow, searchJina],
  news: [searchHackerNews, searchJina, searchTavily],
  paper: [searchArxiv, searchJina, searchTavily],
  facts: [searchWikipedia, searchJina, searchTavily],
  general: [searchJina, searchTavily, searchSearXNG, searchWikipedia]
};

// ============ MAIN LEARN FUNCTION ============
async function learnTopic(topic) {
  addLog("START", `🚀 Learning: "${topic}"`);
  const queryType = routeQuery(topic);
  addLog("ROUTE", `📍 Query type: ${queryType}`);

  const plan = SEARCH_PLANS[queryType];
  addLog("PLAN", `🎯 Using ${plan.length} free search sources in parallel`);

  // Fan out to all sources in parallel with graceful failure
  const results = await Promise.allSettled(
    plan.map(fn => fn(topic).catch(e => {
      addLog("ERROR", `❌ ${fn.name} failed: ${e.message}`);
      return [];
    }))
  );

  const allResults = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value);

  // Dedupe by URL
  const seen = new Set();
  const unique = [];
  for (const r of allResults) {
    const key = (r.url || "").replace(/[#?].*$/, "").toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  // Rank by source quality
  const weights = {
    jina: 3, tavily: 3, wikipedia: 2, hackernews: 2,
    arxiv: 2, github: 2, stackoverflow: 2, searxng: 1
  };
  unique.sort((a, b) =>
    (weights[b.source] || 0) - (weights[a.source] || 0) ||
    (b.snippet?.length || 0) - (a.snippet?.length || 0)
  );

  // Save to pending for your approval
  const findings = unique.map(r => ({
    id: hashId(r.url + Date.now()),
    topic,
    question: r.title,
    answer: r.snippet,
    source: r.url,
    from: r.source,
    found_at: new Date().toISOString(),
    status: "pending"
  }));

  pending.unshift(...findings);
  await savePending();

  addLog("DONE", `🎉 Found ${findings.length} unique items from ${plan.length} sources`);
  return findings;
}

// ============ READ SPECIFIC URL (using Jina Reader - free) ============
async function readURL(url) {
  addLog("READ", `📖 Reading: ${url}`);
  try {
    if (!url.startsWith("http")) url = "https://" + url;
    const headers = {};
    if (KEYS.jina) headers.Authorization = `Bearer ${KEYS.jina}`;
    const res = await timedFetch(
      `https://r.jina.ai/${url}`,
      { headers },
      15000
    );
    const text = await res.text();
    addLog("READ_OK", `✅ Read ${text.length} chars`);
    return { url, content: text.slice(0, 5000) };
  } catch (e) {
    addLog("ERROR", `❌ Read failed: ${e.message}`);
    return { url, error: e.message };
  }
}

// ============ ASK AI (search brain first) ============
function askBrain(question) {
  const q = question.toLowerCase();
  const words = q.split(" ").filter(w => w.length > 2);

  const scored = brain.map(pair => {
    const text = (pair.input + " " + pair.output).toLowerCase();
    let score = 0;
    if (text.includes(q)) score += 20;
    words.forEach(w => { if (text.includes(w)) score += 2; });
    return { ...pair, score };
  });

  const top = scored
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return top;
}

// ============ API ROUTES ============

app.post("/learn", async (req, res) => {
  const topic = (req.body.topic || "").trim();
  if (!topic) return res.status(400).json({ error: "Topic required" });
  try {
    const findings = await learnTopic(topic);
    res.json({
      success: true,
      found: findings.length,
      total_pending: pending.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/read", async (req, res) => {
  const url = (req.body.url || "").trim();
  if (!url) return res.status(400).json({ error: "URL required" });
  const result = await readURL(url);
  if (result.content) {
    const finding = {
      id: hashId(url),
      topic: "manual",
      question: `Content from ${url}`,
      answer: result.content.slice(0, 500),
      source: url,
      from: "jina-reader",
      found_at: new Date().toISOString(),
      status: "pending"
    };
    pending.unshift(finding);
    await savePending();
  }
  res.json(result);
});

app.get("/pending", (req, res) => {
  res.json({ pending: pending.slice(0, 50), total: pending.length });
});

app.post("/approve/:id", async (req, res) => {
  const id = req.params.id;
  const idx = pending.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const item = pending[idx];
  brain.push({
    input: item.question,
    output: item.answer,
    topic: item.topic,
    source: item.source,
    from: item.from,
    approved_at: new Date().toISOString()
  });
  pending.splice(idx, 1);
  await saveBrain();
  await savePending();
  addLog("APPROVED", `✅ Added to brain: "${item.question.slice(0, 60)}"`);
  res.json({ success: true, brain_size: brain.length });
});

app.post("/reject/:id", async (req, res) => {
  const id = req.params.id;
  const idx = pending.findIndex(p => p.id === id);
  if (idx !== -1) {
    pending.splice(idx, 1);
    await savePending();
  }
  res.json({ success: true });
});

app.post("/approve-all", async (req, res) => {
  for (const item of pending) {
    brain.push({
      input: item.question,
      output: item.answer,
      topic: item.topic,
      source: item.source,
      from: item.from,
      approved_at: new Date().toISOString()
    });
  }
  const count = pending.length;
  pending = [];
  await saveBrain();
  await savePending();
  addLog("BULK_APPROVED", `✅ Approved ${count} items`);
  res.json({ approved: count, brain_size: brain.length });
});

app.post("/ask", (req, res) => {
  const question = req.body.question || "";
  const results = askBrain(question);
  if (results.length > 0) {
    const best = results[0];
    res.json({
      found: true,
      answer: best.output,
      source: best.source,
      topic: best.topic,
      related: results.slice(1).map(r => ({ question: r.input, source: r.source }))
    });
  } else {
    res.json({
      found: false,
      answer: `I haven't learned about this yet. Go to Learn tab and teach me about "${question}"!`
    });
  }
});

app.get("/logs", (req, res) => {
  res.json({ logs: logs.slice(0, 50) });
});

app.post("/clear-logs", async (req, res) => {
  logs = [];
  await saveLogs();
  res.json({ cleared: true });
});

app.get("/stats", (req, res) => {
  const topics = [...new Set(brain.map(p => p.topic))];
  const sources = [...new Set(brain.map(p => p.from))];
  res.json({
    brain_size: brain.length,
    pending_size: pending.length,
    logs_count: logs.length,
    topics,
    sources,
    apis_active: {
      jina: true,
      tavily: !!KEYS.tavily,
      searxng: true,
      wikipedia: true,
      hackernews: true,
      github: true,
      stackoverflow: true,
      arxiv: true
    }
  });
});

app.get("/download", (req, res) => {
  res.download(BRAIN_FILE, "brain.jsonl");
});

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// Error handler
app.use((err, req, res, next) => {
  addLog("ERROR", `Server error: ${err.message}`);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  addLog("STARTUP", `🚀 AI Agent running on port ${PORT}`);
  console.log(`
╔════════════════════════════════════════════╗
║   MY LEARNING AI - Running                ║
║   Port: ${PORT}                            ║
║   Brain: ${brain.length} pairs                       ║
║   Free APIs: 8 sources ready              ║
╚════════════════════════════════════════════╝
  `);
});
