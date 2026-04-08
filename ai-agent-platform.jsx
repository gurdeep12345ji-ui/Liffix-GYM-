import { useState, useEffect, useRef } from "react";

const AGENTS = [
  { id: 1, name: "CodeCraft", icon: "⚙", category: "Development", desc: "Full-stack code generation & review", model: "claude-sonnet-4-20250514", color: "#6366f1", system: "You are CodeCraft, an expert full-stack developer. Write clean, production-ready code with comments. Support all languages." },
  { id: 2, name: "DataSage", icon: "📊", category: "Analytics", desc: "Data analysis & visualization insights", model: "claude-sonnet-4-20250514", color: "#0ea5e9", system: "You are DataSage, an expert data scientist. Analyze data, suggest visualizations, write pandas/SQL queries." },
  { id: 3, name: "ContentGenius", icon: "✍", category: "Content", desc: "Blog posts, articles & SEO content", model: "claude-sonnet-4-20250514", color: "#10b981", system: "You are ContentGenius. Write compelling, SEO-optimized content. Focus on engagement and clarity." },
  { id: 4, name: "LegalEagle", icon: "⚖", category: "Legal", desc: "Legal document drafting & review", model: "claude-sonnet-4-20250514", color: "#f59e0b", system: "You are LegalEagle, a legal assistant. Draft contracts, review documents, explain legal concepts. Always recommend consulting a real lawyer." },
  { id: 5, name: "FinanceBot", icon: "💹", category: "Finance", desc: "Financial analysis & budgeting", model: "claude-sonnet-4-20250514", color: "#22d3ee", system: "You are FinanceBot. Analyze financials, create budgets, explain investment concepts. Not financial advice." },
  { id: 6, name: "ResearchBot", icon: "🔬", category: "Research", desc: "Deep research & literature review", model: "claude-sonnet-4-20250514", color: "#a855f7", system: "You are ResearchBot. Conduct thorough research, summarize papers, identify trends, cite sources." },
  { id: 7, name: "MarketingGuru", icon: "📣", category: "Marketing", desc: "Marketing strategies & campaigns", model: "claude-sonnet-4-20250514", color: "#ec4899", system: "You are MarketingGuru. Create marketing strategies, ad copy, social media campaigns and growth plans." },
  { id: 8, name: "CustomerCare", icon: "💬", category: "Support", desc: "Customer support & ticket handling", model: "claude-sonnet-4-20250514", color: "#f97316", system: "You are CustomerCare. Handle customer queries professionally, empathetically and efficiently." },
  { id: 9, name: "TranslatorPro", icon: "🌐", category: "Language", desc: "100+ language translation & localization", model: "claude-sonnet-4-20250514", color: "#14b8a6", system: "You are TranslatorPro. Translate accurately across 100+ languages maintaining tone and context." },
  { id: 10, name: "HRAssist", icon: "👥", category: "HR", desc: "HR policies, hiring & onboarding", model: "claude-sonnet-4-20250514", color: "#84cc16", system: "You are HRAssist. Help with HR policies, job descriptions, interview questions, onboarding plans." },
  { id: 11, name: "DesignCritic", icon: "🎨", category: "Design", desc: "UI/UX feedback & design principles", model: "claude-sonnet-4-20250514", color: "#e879f9", system: "You are DesignCritic. Provide expert UI/UX feedback, accessibility advice, and design system guidance." },
  { id: 12, name: "EmailWriter", icon: "📧", category: "Content", desc: "Professional email drafting", model: "claude-sonnet-4-20250514", color: "#fb7185", system: "You are EmailWriter. Draft clear, professional emails for any business context." },
  { id: 13, name: "ProductManager", icon: "🗺", category: "Product", desc: "PRDs, roadmaps & user stories", model: "claude-sonnet-4-20250514", color: "#fbbf24", system: "You are ProductManager. Write PRDs, user stories, feature specs and product roadmaps." },
  { id: 14, name: "SQLMaster", icon: "🗄", category: "Development", desc: "SQL queries, optimization & schema", model: "claude-sonnet-4-20250514", color: "#60a5fa", system: "You are SQLMaster. Write optimized SQL queries, design schemas, explain query plans." },
  { id: 15, name: "SecurityAudit", icon: "🛡", category: "Security", desc: "Security review & vulnerability scan", model: "claude-sonnet-4-20250514", color: "#34d399", system: "You are SecurityAudit. Review code and systems for vulnerabilities, suggest security best practices." },
  { id: 16, name: "APIBuilder", icon: "🔌", category: "Development", desc: "REST/GraphQL API design & docs", model: "claude-sonnet-4-20250514", color: "#818cf8", system: "You are APIBuilder. Design RESTful and GraphQL APIs, write OpenAPI specs and documentation." },
  { id: 17, name: "TechWriter", icon: "📝", category: "Content", desc: "Technical documentation & manuals", model: "claude-sonnet-4-20250514", color: "#2dd4bf", system: "You are TechWriter. Create clear technical documentation, user guides and API references." },
  { id: 18, name: "MindMapper", icon: "🧠", category: "Productivity", desc: "Brainstorming & mind mapping", model: "claude-sonnet-4-20250514", color: "#c084fc", system: "You are MindMapper. Help brainstorm ideas, create concept maps, and organize thoughts clearly." },
  { id: 19, name: "SalesCoach", icon: "🏆", category: "Sales", desc: "Sales scripts & negotiation tactics", model: "claude-sonnet-4-20250514", color: "#f87171", system: "You are SalesCoach. Write sales scripts, objection handlers, and negotiation strategies." },
  { id: 20, name: "SocialMedia", icon: "📱", category: "Marketing", desc: "Social posts, captions & hashtags", model: "claude-sonnet-4-20250514", color: "#38bdf8", system: "You are SocialMedia. Create viral social posts, captions and hashtag strategies for all platforms." },
  { id: 21, name: "MedHelper", icon: "🏥", category: "Health", desc: "Medical info & symptom guidance", model: "claude-sonnet-4-20250514", color: "#4ade80", system: "You are MedHelper. Explain medical concepts clearly. Always recommend seeing a doctor." },
  { id: 22, name: "MathGenius", icon: "∑", category: "Education", desc: "Math problem solving & tutoring", model: "claude-sonnet-4-20250514", color: "#fb923c", system: "You are MathGenius. Solve math problems step by step across all levels." },
  { id: 23, name: "StoryTeller", icon: "📖", category: "Creative", desc: "Creative writing & storytelling", model: "claude-sonnet-4-20250514", color: "#e879f9", system: "You are StoryTeller. Write engaging stories, develop characters, and craft compelling narratives." },
  { id: 24, name: "PresentPro", icon: "🎯", category: "Productivity", desc: "Presentation outlines & slide content", model: "claude-sonnet-4-20250514", color: "#facc15", system: "You are PresentPro. Create compelling presentation outlines, key messages and speaker notes." },
  { id: 25, name: "ResumeBuilder", icon: "📄", category: "Career", desc: "Resume writing & LinkedIn optimization", model: "claude-sonnet-4-20250514", color: "#a3e635", system: "You are ResumeBuilder. Craft ATS-optimized resumes and compelling LinkedIn profiles." },
  { id: 26, name: "InterviewCoach", icon: "🎤", category: "Career", desc: "Interview prep & mock questions", model: "claude-sonnet-4-20250514", color: "#67e8f9", system: "You are InterviewCoach. Run mock interviews, provide feedback, teach STAR method." },
  { id: 27, name: "StartupAdvisor", icon: "🚀", category: "Business", desc: "Startup strategy & pitch decks", model: "claude-sonnet-4-20250514", color: "#f472b6", system: "You are StartupAdvisor. Help founders with strategy, go-to-market plans and investor pitches." },
  { id: 28, name: "PromptEngineer", icon: "🤖", category: "AI", desc: "Craft perfect AI prompts", model: "claude-sonnet-4-20250514", color: "#818cf8", system: "You are PromptEngineer. Design optimal prompts for any AI model. Teach prompt engineering techniques." },
  { id: 29, name: "DataCleaner", icon: "🧹", category: "Analytics", desc: "Data cleaning & preprocessing", model: "claude-sonnet-4-20250514", color: "#6ee7b7", system: "You are DataCleaner. Help clean, normalize and preprocess datasets. Write Python/R cleaning scripts." },
  { id: 30, name: "CloudArchitect", icon: "☁", category: "DevOps", desc: "AWS/GCP/Azure architecture design", model: "claude-sonnet-4-20250514", color: "#93c5fd", system: "You are CloudArchitect. Design scalable cloud architectures on AWS, GCP and Azure." },
  { id: 31, name: "CIRunner", icon: "⚡", category: "DevOps", desc: "CI/CD pipelines & automation", model: "claude-sonnet-4-20250514", color: "#fcd34d", system: "You are CIRunner. Build CI/CD pipelines with GitHub Actions, Jenkins, and GitLab CI." },
  { id: 32, name: "TestBot", icon: "✅", category: "Development", desc: "Unit & integration test generation", model: "claude-sonnet-4-20250514", color: "#86efac", system: "You are TestBot. Write comprehensive unit, integration and e2e tests for any codebase." },
  { id: 33, name: "DockerDev", icon: "🐳", category: "DevOps", desc: "Docker & Kubernetes configurations", model: "claude-sonnet-4-20250514", color: "#7dd3fc", system: "You are DockerDev. Write Dockerfiles, docker-compose and Kubernetes manifests." },
  { id: 34, name: "SEOBot", icon: "🔍", category: "Marketing", desc: "SEO analysis & keyword strategy", model: "claude-sonnet-4-20250514", color: "#d4d4aa", system: "You are SEOBot. Perform SEO audits, keyword research and on-page optimization guidance." },
  { id: 35, name: "CopyWriter", icon: "✒", category: "Content", desc: "Conversion-focused ad & web copy", model: "claude-sonnet-4-20250514", color: "#fca5a5", system: "You are CopyWriter. Write high-converting ad copy, landing pages and sales emails." },
  { id: 36, name: "MeetingBot", icon: "📅", category: "Productivity", desc: "Meeting agendas, notes & action items", model: "claude-sonnet-4-20250514", color: "#a5b4fc", system: "You are MeetingBot. Structure meeting agendas, write minutes and extract action items." },
  { id: 37, name: "ContractDrafter", icon: "📋", category: "Legal", desc: "Contract templates & clauses", model: "claude-sonnet-4-20250514", color: "#d6d3d1", system: "You are ContractDrafter. Draft standard contracts, NDAs, and review clauses. Not legal advice." },
  { id: 38, name: "InvestorBot", icon: "💰", category: "Finance", desc: "Investment research & due diligence", model: "claude-sonnet-4-20250514", color: "#bbf7d0", system: "You are InvestorBot. Research companies, analyze financials, prepare due diligence reports." },
  { id: 39, name: "EducatorPro", icon: "🎓", category: "Education", desc: "Lesson plans & curriculum design", model: "claude-sonnet-4-20250514", color: "#fef08a", system: "You are EducatorPro. Design lesson plans, quizzes, and curricula for any subject." },
  { id: 40, name: "HealthCoach", icon: "🏋", category: "Health", desc: "Fitness plans & nutrition advice", model: "claude-sonnet-4-20250514", color: "#86efac", system: "You are HealthCoach. Create personalized fitness and nutrition plans. Recommend consulting professionals." },
  { id: 41, name: "TravelPlanner", icon: "✈", category: "Lifestyle", desc: "Trip itineraries & travel tips", model: "claude-sonnet-4-20250514", color: "#67e8f9", system: "You are TravelPlanner. Plan detailed itineraries, suggest accommodation and local tips." },
  { id: 42, name: "RecipeChef", icon: "🍳", category: "Lifestyle", desc: "Recipes, meal plans & cooking tips", model: "claude-sonnet-4-20250514", color: "#fed7aa", system: "You are RecipeChef. Create recipes, meal plans, and cooking guides for all dietary needs." },
  { id: 43, name: "BudgetBuddy", icon: "💵", category: "Finance", desc: "Personal budgeting & expense tracking", model: "claude-sonnet-4-20250514", color: "#bbf7d0", system: "You are BudgetBuddy. Help create personal budgets, track expenses, and set savings goals." },
  { id: 44, name: "ScriptWriter", icon: "🎬", category: "Creative", desc: "Video scripts & screenplays", model: "claude-sonnet-4-20250514", color: "#e9d5ff", system: "You are ScriptWriter. Write video scripts, YouTube content, and screenplays in proper format." },
  { id: 45, name: "PolicyBot", icon: "📜", category: "Legal", desc: "Privacy policies & terms of service", model: "claude-sonnet-4-20250514", color: "#c7d2fe", system: "You are PolicyBot. Draft privacy policies, terms of service and GDPR-compliant documents." },
  { id: 46, name: "DebugHelper", icon: "🐛", category: "Development", desc: "Bug finding & code debugging", model: "claude-sonnet-4-20250514", color: "#fca5a5", system: "You are DebugHelper. Find bugs, explain errors, and suggest fixes in any programming language." },
  { id: 47, name: "RegexBot", icon: "🔤", category: "Development", desc: "Regular expression builder & tester", model: "claude-sonnet-4-20250514", color: "#a5f3fc", system: "You are RegexBot. Build, explain and test regular expressions for any pattern matching need." },
  { id: 48, name: "ProjectManager", icon: "📌", category: "Productivity", desc: "Project plans, timelines & sprints", model: "claude-sonnet-4-20250514", color: "#fde68a", system: "You are ProjectManager. Create project plans, sprint boards, risk assessments and timelines." },
  { id: 49, name: "EthicsGuide", icon: "🌱", category: "AI", desc: "AI ethics & responsible tech", model: "claude-sonnet-4-20250514", color: "#bbf7d0", system: "You are EthicsGuide. Advise on responsible AI use, bias detection, and ethical frameworks." },
  { id: 50, name: "NewsDigest", icon: "📰", category: "Research", desc: "News summarization & fact-checking", model: "claude-sonnet-4-20250514", color: "#e2e8f0", system: "You are NewsDigest. Summarize news articles, identify key facts, and check for misinformation." },
  { id: 51, name: "ExcelBot", icon: "📈", category: "Analytics", desc: "Excel formulas & spreadsheet help", model: "claude-sonnet-4-20250514", color: "#86efac", system: "You are ExcelBot. Write complex Excel/Google Sheets formulas and VBA macros." },
  { id: 52, name: "CRMBot", icon: "🤝", category: "Sales", desc: "CRM management & pipeline strategy", model: "claude-sonnet-4-20250514", color: "#fcd34d", system: "You are CRMBot. Optimize CRM pipelines, write follow-up sequences and forecast sales." },
  { id: 53, name: "EventPlanner", icon: "🎉", category: "Lifestyle", desc: "Event planning & management", model: "claude-sonnet-4-20250514", color: "#f9a8d4", system: "You are EventPlanner. Plan corporate and personal events: venues, catering, timelines, budgets." },
  { id: 54, name: "InfraBot", icon: "🏗", category: "DevOps", desc: "Infrastructure as code & Terraform", model: "claude-sonnet-4-20250514", color: "#93c5fd", system: "You are InfraBot. Write Terraform, Pulumi and Ansible for cloud infrastructure automation." },
  { id: 55, name: "PhilosophyBot", icon: "🧩", category: "Education", desc: "Philosophy, logic & critical thinking", model: "claude-sonnet-4-20250514", color: "#d8b4fe", system: "You are PhilosophyBot. Explore philosophical ideas, logical fallacies and critical thinking frameworks." },
  { id: 56, name: "MasterOrchestrator", icon: "👑", category: "AI", desc: "Coordinates all 56 agents together", model: "claude-sonnet-4-20250514", color: "#fbbf24", system: "You are MasterOrchestrator, the most powerful agent. You coordinate tasks across all 56 specialized agents and provide comprehensive multi-domain responses." },
];

const CATEGORIES = ["All", ...Array.from(new Set(AGENTS.map(a => a.category)))];

const PLANS = [
  { name: "Starter", price: "$0", period: "forever", features: ["5 agents", "50 messages/day", "Community support"], agents: 5, cta: "Get Started" },
  { name: "Pro", price: "$29", period: "/month", features: ["All 56 agents", "Unlimited messages", "Priority support", "API access", "Custom prompts"], agents: 56, cta: "Start Pro", highlight: true },
  { name: "Enterprise", price: "$99", period: "/month", features: ["All 56 agents", "Unlimited messages", "Dedicated support", "Custom deployment", "SLA guarantee", "Team workspace"], agents: 56, cta: "Contact Sales" },
];

// --- Simulated Auth & Storage ---
const DB = {
  users: {},
  sessions: {},
  apiKeys: {},
};

function hashPw(pw) { return btoa(pw + "_agentplatform_salt"); }

function createUser(email, password, name) {
  if (DB.users[email]) return { error: "Email already registered" };
  const id = "usr_" + Date.now();
  DB.users[email] = { id, email, name, password: hashPw(password), plan: "Starter", joined: new Date().toISOString(), apiKey: null };
  return { user: DB.users[email] };
}

function loginUser(email, password) {
  const u = DB.users[email];
  if (!u || u.password !== hashPw(password)) return { error: "Invalid credentials" };
  const token = "tok_" + Math.random().toString(36).slice(2);
  DB.sessions[token] = email;
  return { token, user: u };
}

function getUser(token) {
  const email = DB.sessions[token];
  return email ? DB.users[email] : null;
}

function saveApiKey(token, key) {
  const email = DB.sessions[token];
  if (!email) return false;
  DB.users[email].apiKey = key;
  return true;
}

function upgradePlan(token, plan) {
  const email = DB.sessions[token];
  if (!email) return false;
  DB.users[email].plan = plan;
  return true;
}

// --- Main App ---
export default function App() {
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [notification, setNotification] = useState(null);

  function notify(msg, type = "success") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function handleLogin(token, userData) {
    setSession(token);
    setUser(userData);
    setPage("dashboard");
  }

  function handleLogout() {
    setSession(null);
    setUser(null);
    setActiveAgent(null);
    setPage("home");
  }

  function openAgent(agent) {
    if (!session) { setPage("auth"); return; }
    const allowed = user?.plan === "Pro" || user?.plan === "Enterprise" ? 56 : 5;
    if (agent.id > allowed) { notify("Upgrade to Pro for access to all 56 agents!", "warning"); return; }
    if (!user?.apiKey) { notify("Please add your Anthropic API key in Settings first", "warning"); setPage("settings"); return; }
    setActiveAgent(agent);
    setPage("chat");
  }

  function refreshUser() { setUser({ ...getUser(session) }); }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif", position: "relative" }}>
      {/* Notification */}
      {notification && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: notification.type === "success" ? "#065f46" : notification.type === "warning" ? "#92400e" : "#7f1d1d", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", maxWidth: 300 }}>{notification.msg}</div>
      )}

      {/* Nav */}
      <Nav session={session} user={user} page={page} setPage={setPage} onLogout={handleLogout} />

      {/* Pages */}
      {page === "home" && <HomePage setPage={setPage} setAuthMode={setAuthMode} openAgent={openAgent} />}
      {page === "auth" && <AuthPage mode={authMode} setMode={setAuthMode} onLogin={handleLogin} notify={notify} />}
      {page === "dashboard" && <Dashboard user={user} openAgent={openAgent} setPage={setPage} />}
      {page === "agents" && <AgentsPage user={user} openAgent={openAgent} />}
      {page === "chat" && activeAgent && <ChatPage agent={activeAgent} user={user} onBack={() => { setPage("agents"); setActiveAgent(null); }} notify={notify} />}
      {page === "settings" && <SettingsPage user={user} session={session} onSave={refreshUser} notify={notify} />}
      {page === "pricing" && <PricingPage session={session} user={user} onUpgrade={(plan) => { upgradePlan(session, plan); refreshUser(); notify(`Upgraded to ${plan}!`); }} setPage={setPage} setAuthMode={setAuthMode} />}
    </div>
  );
}

// --- Nav ---
function Nav({ session, user, page, setPage, onLogout }) {
  return (
    <nav style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
      <div onClick={() => setPage(session ? "dashboard" : "home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #6366f1, #ec4899)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👑</div>
        <span style={{ fontWeight: 700, fontSize: 18, background: "linear-gradient(90deg, #818cf8, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AgentVerse</span>
        <span style={{ fontSize: 11, background: "rgba(99,102,241,0.2)", color: "#818cf8", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(99,102,241,0.3)" }}>56 Agents</span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {["agents", "pricing"].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{ background: page === p ? "rgba(99,102,241,0.2)" : "none", color: page === p ? "#818cf8" : "#94a3b8", border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, textTransform: "capitalize" }}>{p}</button>
        ))}
        {session ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginLeft: 8 }}>
            <button onClick={() => setPage("settings")} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>⚙ Settings</button>
            <button onClick={onLogout} style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Logout</button>
            <div style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
            <button onClick={() => { setPage("auth"); }} style={{ background: "none", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Sign in</button>
            <button onClick={() => { setPage("auth"); }} style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", border: "none", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Get Started</button>
          </div>
        )}
      </div>
    </nav>
  );
}

// --- Home Page ---
function HomePage({ setPage, setAuthMode, openAgent }) {
  const featured = AGENTS.slice(0, 9);
  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 60px", background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)" }}>
        <div style={{ display: "inline-block", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "#818cf8", marginBottom: 24 }}>✦ 56 Specialized AI Agents • Powered by Claude</div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 20px", background: "linear-gradient(135deg, #fff 0%, #c7d2fe 50%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One Platform.<br />56 Brilliant AI Agents.</h1>
        <p style={{ fontSize: 18, color: "#94a3b8", maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>From code to legal, finance to creativity — deploy enterprise-grade AI agents instantly with your own API key.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => { setAuthMode("signup"); setPage("auth"); }} style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 12, cursor: "pointer", fontSize: 16, fontWeight: 700, boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>Start Free →</button>
          <button onClick={() => setPage("agents")} style={{ background: "rgba(255,255,255,0.05)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", padding: "14px 32px", borderRadius: 12, cursor: "pointer", fontSize: 16 }}>Browse All 56 Agents</button>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 60, flexWrap: "wrap" }}>
          {[["56", "AI Agents"], ["15+", "Categories"], ["∞", "Messages"], ["Claude", "Powered"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#818cf8" }}>{v}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Agents Grid */}
      <div style={{ padding: "0 24px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: "#e2e8f0" }}>Featured Agents</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {featured.map(agent => <AgentCard key={agent.id} agent={agent} onClick={() => openAgent(agent)} locked={false} />)}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={() => setPage("agents")} style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>View All 56 Agents →</button>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>How It Works</h2>
          <p style={{ color: "#64748b", marginBottom: 48 }}>Get started in 3 simple steps</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { step: "01", icon: "🔑", title: "Add Your API Key", desc: "Paste your Anthropic API key in Settings. Your key stays private — it never leaves your browser." },
              { step: "02", icon: "🤖", title: "Choose an Agent", desc: "Browse 56 specialized agents across 15+ categories. Each is expertly prompted for their domain." },
              { step: "03", icon: "⚡", title: "Start Working", desc: "Chat directly with your agent. Get expert help for any task instantly at the cost of your own API usage." },
            ].map(item => (
              <div key={item.step} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, background: "rgba(99,102,241,0.1)", padding: "3px 10px", borderRadius: 20 }}>{item.step}</span>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ padding: "60px 24px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>💡</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#fbbf24" }}>How You Pay & How It Works</h2>
          <p style={{ color: "#94a3b8", lineHeight: 1.8, marginBottom: 20 }}>
            <strong style={{ color: "#e2e8f0" }}>AgentVerse uses a dual model:</strong><br />
            1. <strong style={{ color: "#818cf8" }}>Platform fee</strong> — Pay us $0 (Free), $29/mo (Pro), or $99/mo (Enterprise) to access the platform and agents.<br />
            2. <strong style={{ color: "#ec4899" }}>AI usage cost</strong> — You bring your own Anthropic API key. AI usage is charged directly by Anthropic to your account (typically ~$0.003 per 1K tokens). This means <em>you pay only for what you use</em>, with full transparency.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", padding: "10px 20px", borderRadius: 10, textDecoration: "none", fontSize: 13 }}>Get Anthropic API Key →</a>
            <button onClick={() => setPage("pricing")} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>View Plans</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Auth Page ---
function AuthPage({ mode, setMode, onLogin, notify }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    setTimeout(() => {
      if (mode === "signup") {
        if (!form.name || !form.email || !form.password) { setError("All fields required"); setLoading(false); return; }
        if (form.password.length < 6) { setError("Password must be 6+ characters"); setLoading(false); return; }
        const res = createUser(form.email, form.password, form.name);
        if (res.error) { setError(res.error); setLoading(false); return; }
        const loginRes = loginUser(form.email, form.password);
        onLogin(loginRes.token, loginRes.user);
        notify("Welcome to AgentVerse! 🎉");
      } else {
        if (!form.email || !form.password) { setError("All fields required"); setLoading(false); return; }
        const res = loginUser(form.email, form.password);
        if (res.error) { setError(res.error); setLoading(false); return; }
        onLogin(res.token, res.user);
        notify("Welcome back!");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 48, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👑</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{mode === "login" ? "Welcome back" : "Join AgentVerse"}</h2>
          <p style={{ color: "#64748b", marginTop: 8 }}>{mode === "login" ? "Sign in to your account" : "Create your free account"}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", border: "none", padding: "13px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>{loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748b" }}>
          {mode === "login" ? "No account? " : "Have an account? "}
          <span onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ color: "#818cf8", cursor: "pointer" }}>
            {mode === "login" ? "Sign up free" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// --- Dashboard ---
function Dashboard({ user, openAgent, setPage }) {
  const allowed = user?.plan === "Pro" || user?.plan === "Enterprise" ? 56 : 5;
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
        <p style={{ color: "#64748b", marginTop: 6 }}>You're on the <span style={{ color: "#818cf8" }}>{user?.plan}</span> plan — {allowed} agents available</p>
      </div>

      {!user?.apiKey && (
        <div onClick={() => setPage("settings")} style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 20, marginBottom: 28, cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: "#fbbf24" }}>Add your Anthropic API key to activate agents</div>
            <div style={{ fontSize: 13, color: "#92400e", marginTop: 4 }}>Click here → Settings → Enter API Key → Save</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Agents Available", value: allowed },
          { label: "Your Plan", value: user?.plan },
          { label: "API Key", value: user?.apiKey ? "✓ Active" : "Not Set" },
          { label: "Categories", value: "15+" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 18px" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#818cf8" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Quick Access Agents</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {AGENTS.slice(0, 12).map(a => (
          <AgentCard key={a.id} agent={a} onClick={() => openAgent(a)} locked={a.id > allowed} />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button onClick={() => setPage("agents")} style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", padding: "11px 24px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>View All 56 Agents →</button>
      </div>
    </div>
  );
}

// --- Agents Page ---
function AgentsPage({ user, openAgent }) {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const allowed = user?.plan === "Pro" || user?.plan === "Enterprise" ? 56 : user ? 5 : 0;

  const filtered = AGENTS.filter(a =>
    (cat === "All" || a.category === cat) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>All 56 AI Agents</h1>
      <p style={{ color: "#64748b", marginBottom: 28 }}>Specialized AI agents for every domain — powered by your Anthropic API key</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search agents..." style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: "#e2e8f0", fontSize: 14, outline: "none", minWidth: 200 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", color: cat === c ? "#818cf8" : "#64748b", border: cat === c ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)", padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>{filtered.length} agents found</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
        {filtered.map(a => <AgentCard key={a.id} agent={a} onClick={() => openAgent(a)} locked={a.id > allowed} />)}
      </div>
    </div>
  );
}

// --- Agent Card ---
function AgentCard({ agent, onClick, locked }) {
  return (
    <div onClick={onClick} style={{ background: locked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)", border: `1px solid ${locked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.09)"}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s", position: "relative", opacity: locked ? 0.6 : 1 }}
      onMouseEnter={e => { if (!locked) { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.background = locked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = locked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.09)"; e.currentTarget.style.transform = "none"; }}>
      {locked && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 11, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)", padding: "2px 8px", borderRadius: 20 }}>🔒 Pro</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, background: `${agent.color}20`, border: `1px solid ${agent.color}40`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{agent.icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: agent.color, marginTop: 2 }}>{agent.category}</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{agent.desc}</p>
    </div>
  );
}

// --- Chat Page ---
function ChatPage({ agent, user, onBack, notify }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hello! I'm **${agent.name}** — ${agent.desc}. How can I help you today?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = messages.filter(m => m.role !== "system").concat(userMsg).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": user.apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: agent.model, max_tokens: 1500, system: agent.system, messages: apiMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = data.content?.[0]?.text || "No response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${err.message}. Check your API key in Settings.` }]);
    }
    setLoading(false);
  }

  function renderContent(text) {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px">$1</code>').replace(/\n/g, "<br>");
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 20px" }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>← Back</button>
        <div style={{ width: 40, height: 40, background: `${agent.color}20`, border: `1px solid ${agent.color}40`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{agent.icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{agent.name}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{agent.category} • {agent.desc}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%" }}></div>
          <span style={{ fontSize: 12, color: "#22c55e" }}>Active</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 32, height: 32, background: `${agent.color}20`, border: `1px solid ${agent.color}40`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{agent.icon}</div>
            )}
            <div style={{ maxWidth: "75%", background: msg.role === "user" ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(236,72,153,0.2))" : "rgba(255,255,255,0.05)", border: `1px solid ${msg.role === "user" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: "12px 16px", fontSize: 14, color: "#e2e8f0", lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
            {msg.role === "user" && (
              <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #ec4899)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{user?.name?.[0] || "U"}</div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, background: `${agent.color}20`, border: `1px solid ${agent.color}40`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{agent.icon}</div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, background: "#818cf8", borderRadius: "50%", animation: `pulse 1.4s ease-in-out ${i*0.2}s infinite` }}></div>)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "10px 12px" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Ask ${agent.name} anything...`} rows={2} style={{ flex: 1, background: "none", border: "none", color: "#e2e8f0", fontSize: 14, resize: "none", outline: "none", lineHeight: 1.5, padding: 4 }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", border: "none", borderRadius: 10, padding: "0 20px", cursor: "pointer", fontSize: 18, opacity: loading || !input.trim() ? 0.5 : 1 }}>↑</button>
      </div>
      <style>{`@keyframes pulse { 0%,60%,100%{opacity:0.3}30%{opacity:1} }`}</style>
    </div>
  );
}

// --- Settings Page ---
function SettingsPage({ user, session, onSave, notify }) {
  const [apiKey, setApiKey] = useState(user?.apiKey || "");
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  function save() {
    setSaving(true);
    if (!apiKey.startsWith("sk-ant-")) { notify("API key must start with sk-ant-", "error"); setSaving(false); return; }
    saveApiKey(session, apiKey);
    onSave();
    notify("API key saved! All agents are now active. ✅");
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "#64748b", marginBottom: 40 }}>Configure your account and API key</p>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🔑 Anthropic API Key</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>Your API key is used to power all 56 agents. It's stored locally in memory only and never sent to our servers — it goes directly to Anthropic's API. <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: "#818cf8" }}>Get your key here →</a></p>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input type={show ? "text" : "password"} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-api03-..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "monospace" }} />
          <button onClick={() => setShow(!show)} style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>{show ? "Hide" : "Show"}</button>
        </div>
        {user?.apiKey && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#22c55e", marginBottom: 16 }}>✓ API key is active — all agents are ready</div>}
        <button onClick={save} disabled={saving} style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{saving ? "Saving..." : "Save API Key"}</button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Account Info</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {[["Name", user?.name], ["Email", user?.email], ["Plan", user?.plan], ["Member since", new Date(user?.joined).toLocaleDateString()]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#64748b", fontSize: 14 }}>{k}</span>
              <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Pricing Page ---
function PricingPage({ session, user, onUpgrade, setPage, setAuthMode }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Simple, Transparent Pricing</h1>
        <p style={{ color: "#64748b", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>Choose your plan. Bring your own Anthropic API key. Pay only for what you use.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 60 }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{ background: plan.highlight ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)", border: plan.highlight ? "2px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, position: "relative" }}>
            {plan.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #6366f1, #ec4899)", color: "#fff", padding: "4px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: plan.highlight ? "#818cf8" : "#e2e8f0" }}>{plan.price}</span>
              <span style={{ color: "#64748b", fontSize: 14 }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
                  <span style={{ color: "#22c55e" }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={() => {
              if (!session) { setAuthMode("signup"); setPage("auth"); return; }
              if (plan.name !== "Starter") onUpgrade(plan.name);
            }} style={{ width: "100%", background: plan.highlight ? "linear-gradient(135deg, #6366f1, #ec4899)" : "rgba(255,255,255,0.06)", color: "#fff", border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              {user?.plan === plan.name ? "Current Plan ✓" : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* API pricing info */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 32 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>💡 Understanding API Costs</h3>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.8 }}>
          AgentVerse uses your personal Anthropic API key. This means AI usage costs are billed directly by Anthropic to you:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 20 }}>
          {[
            { model: "Claude Sonnet (used here)", input: "$3 / 1M tokens", output: "$15 / 1M tokens" },
            { model: "Avg chat message", input: "~500 tokens", output: "≈ $0.001 per message" },
          ].map(r => (
            <div key={r.model} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#818cf8", marginBottom: 8 }}>{r.model}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{r.input}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{r.output}</div>
            </div>
          ))}
        </div>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 16 }}>Get your API key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: "#818cf8" }}>console.anthropic.com</a> — new accounts get free credits.</p>
      </div>
    </div>
  );
}
