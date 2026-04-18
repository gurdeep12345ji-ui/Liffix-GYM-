const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ============ LOAD BRAIN ============
let brain = [];
try {
  const lines = fs.readFileSync('./brain.jsonl', 'utf8').split('\n');
  lines.forEach(l => { if (l.trim()) brain.push(JSON.parse(l)); });
  console.log(`Brain loaded: ${brain.length} pairs`);
} catch(e) {
  fs.writeFileSync('./brain.jsonl', '');
  console.log('New brain created');
}

// ============ LOAD PENDING ============
let pending = [];
try {
  pending = JSON.parse(fs.readFileSync('./pending.json', 'utf8'));
} catch(e) { pending = []; }

// ============ SAVE FUNCTIONS ============
function saveBrain() {
  const content = brain.map(p => JSON.stringify(p)).join('\n');
  fs.writeFileSync('./brain.jsonl', content);
}

function savePending() {
  fs.writeFileSync('./pending.json', JSON.stringify(pending, null, 2));
}

// ============ INTERNET SEARCH (DuckDuckGo - No API) ============
async function searchWeb(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const results = [];
  $('.result').each((i, el) => {
    if (i >= 5) return false;
    const title = $(el).find('.result__title').text().trim();
    const snippet = $(el).find('.result__snippet').text().trim();
    const link = $(el).find('.result__url').text().trim();
    if (title && snippet) {
      results.push({ title, snippet, link });
    }
  });
  return results;
}

// ============ READ WEBSITE ============
async function readWebsite(url) {
  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove scripts and styles
    $('script, style, nav, footer').remove();

    const title = $('title').text().trim();
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    return { title, text, url };
  } catch(e) {
    return { error: e.message };
  }
}

// ============ LEARN TOPIC ============
async function learnTopic(topic) {
  console.log(`Learning: ${topic}`);
  const searches = [
    `${topic} tutorial`,
    `${topic} example code`,
    `how to ${topic}`,
    `${topic} explained`,
    `${topic} best practices`
  ];

  const findings = [];
  for (const query of searches) {
    const results = await searchWeb(query);
    for (const r of results) {
      findings.push({
        id: Date.now() + Math.random(),
        topic,
        query,
        question: r.title,
        answer: r.snippet,
        source: r.link,
        status: 'pending',
        found_at: new Date().toISOString()
      });
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return findings;
}

// ============ API ROUTES ============

// Start learning a topic
app.post('/learn', async (req, res) => {
  const topic = req.body.topic;
  if (!topic) return res.json({ error: 'Topic required' });
  try {
    const findings = await learnTopic(topic);
    pending.push(...findings);
    savePending();
    res.json({
      success: true,
      found: findings.length,
      total_pending: pending.length
    });
  } catch(e) {
    res.json({ error: e.message });
  }
});

// Read specific website
app.post('/read-url', async (req, res) => {
  const url = req.body.url;
  const result = await readWebsite(url);
  if (result.text) {
    const finding = {
      id: Date.now(),
      topic: 'manual',
      question: result.title,
      answer: result.text,
      source: result.url,
      status: 'pending',
      found_at: new Date().toISOString()
    };
    pending.push(finding);
    savePending();
  }
  res.json(result);
});

// Get pending approvals
app.get('/pending', (req, res) => {
  res.json({ pending, count: pending.length });
});

// Approve a finding
app.post('/approve/:id', (req, res) => {
  const id = req.params.id;
  const index = pending.findIndex(p => String(p.id) === id);
  if (index === -1) return res.json({ error: 'Not found' });

  const finding = pending[index];
  brain.push({
    input: finding.question,
    output: finding.answer,
    topic: finding.topic,
    source: finding.source,
    learned_at: new Date().toISOString()
  });
  saveBrain();
  pending.splice(index, 1);
  savePending();
  res.json({ success: true, brain_size: brain.length });
});

// Reject a finding
app.post('/reject/:id', (req, res) => {
  const id = req.params.id;
  const index = pending.findIndex(p => String(p.id) === id);
  if (index !== -1) {
    pending.splice(index, 1);
    savePending();
  }
  res.json({ success: true });
});

// Bulk approve
app.post('/approve-all', (req, res) => {
  pending.forEach(f => {
    brain.push({
      input: f.question,
      output: f.answer,
      topic: f.topic,
      source: f.source,
      learned_at: new Date().toISOString()
    });
  });
  saveBrain();
  const approved = pending.length;
  pending = [];
  savePending();
  res.json({ approved, brain_size: brain.length });
});

// Ask AI (search brain)
app.post('/ask', (req, res) => {
  const q = (req.body.question || '').toLowerCase();
  const words = q.split(' ').filter(w => w.length > 2);

  let best = null;
  let score = 0;
  brain.forEach(p => {
    const text = (p.input + ' ' + p.output).toLowerCase();
    let s = 0;
    words.forEach(w => { if (text.includes(w)) s++; });
    if (s > score) { score = s; best = p; }
  });

  if (best) {
    res.json({
      found: true,
      answer: best.output,
      source: best.source,
      topic: best.topic
    });
  } else {
    res.json({
      found: false,
      answer: 'I have not learned that yet. Teach me by using the Learn button!'
    });
  }
});

// Stats
app.get('/stats', (req, res) => {
  const topics = [...new Set(brain.map(p => p.topic))];
  res.json({
    brain_size: brain.length,
    pending_size: pending.length,
    topics,
    status: 'active'
  });
});

// Export JSONL
app.get('/download', (req, res) => {
  res.download('./brain.jsonl');
});

// Daily auto-learn
setInterval(async () => {
  console.log('Daily auto-learn triggered');
  const dailyTopics = ['programming tips', 'javascript tricks', 'python tutorials'];
  for (const t of dailyTopics) {
    const findings = await learnTopic(t);
    pending.push(...findings);
  }
  savePending();
}, 24 * 60 * 60 * 1000); // Every 24 hours

app.listen(3000, () => console.log('AI running on port 3000'));
