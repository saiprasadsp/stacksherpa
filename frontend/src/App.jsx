import { useEffect, useState } from "react";
import {
  Activity, AlertCircle, ArrowUpRight, Bot, CheckCircle2, ChevronRight,
  CircleHelp, FileText, Github, LoaderCircle, Send, ShieldCheck, Terminal,
  Upload, Zap
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const sampleLogs = `2026-10-12T10:21:01Z ERROR POST /api/login status=500
2026-10-12T10:21:02Z ERROR Database connection timeout after 3000ms
2026-10-12T10:21:03Z ERROR Connection pool exhausted active=30 max=30
2026-10-12T10:21:04Z WARN Authentication request failed user_id=demo`;

export default function App() {
  const [logs, setLogs] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("Why are login requests failing, and what should I investigate first?");
  const [chat, setChat] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setAnalysis(null);
    setChat(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API}/api/logs/upload`, { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "Could not upload this file");
      setLogs(payload.logs);
      setSelectedFile(`${payload.filename} · ${payload.lines.toLocaleString()} lines`);
    } catch (error) {
      setUploadError(error.message);
      setSelectedFile("");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function analyze() {
    setLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const response = await fetch(`${API}/api/diagnostics/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs })
      });
      if (!response.ok) throw new Error("Analysis request failed");
      setAnalysis(await response.json());
    } catch (error) {
      setAnalysis({ severity: "unknown", summary: error.message + ". Check that the backend is running.", signals: [], recommendations: [] });
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function ask() {
    if (!question.trim()) return;
    setLoadingChat(true);
    setChat(null);
    try {
      const response = await fetch(`${API}/api/assistant/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, logs: logs.slice(0, 50000) })
      });
      if (!response.ok) throw new Error("Assistant request failed");
      setChat(await response.json());
    } catch (error) {
      setChat({ answer: error.message + ". Check that the backend is running.", sources: [], mode: "error" });
    } finally {
      setLoadingChat(false);
    }
  }

  const severity = analysis?.severity || "unknown";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={19}/></div><span>stack<span className="mint">sherpa</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="nav-item active"><Activity size={17}/> Incident workspace</button>
        <button className="nav-item" onClick={() => document.getElementById("knowledge")?.scrollIntoView({behavior:"smooth"})}><FileText size={17}/> Knowledge sources</button>
        <div className="sidebar-bottom">
          <div className="status-card">
            <span className={`status-dot ${apiStatus}`}></span>
            <div><strong>API {apiStatus}</strong><small>{apiStatus === "online" ? "Backend connected" : apiStatus === "offline" ? "Cannot reach backend" : "Checking connection"}</small></div>
          </div>
          <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer"><Github size={16}/> Project repository <ArrowUpRight size={14}/></a>
          <div className="version">STACKSHERPA · LOG FILE WORKSPACE</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <ChevronRight size={14}/> <strong>Incident analysis</strong></div>
          <div className="top-right"><span className="environment"><span className="status-dot online"></span> LOCAL ENVIRONMENT</span><div className="avatar">SS</div></div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow"><Zap size={13}/> AI OPERATIONS WORKSPACE</div>
            <h1>Incident workspace</h1>
            <p>Investigate application issues with log diagnostics and evidence-grounded AI.</p>
          </div>
          <div className="incident-tag"><span className="status-dot warning"></span> LOCAL LOG ANALYSIS</div>
        </section>

        <section className="metrics">
          <div className="metric-card"><div className="metric-icon"><Activity size={17}/></div><span>Workspace</span><strong>Development</strong><small>Local environment</small></div>
          <div className="metric-card"><div className="metric-icon amber"><AlertCircle size={17}/></div><span>Detected severity</span><strong>{severity.toUpperCase()}</strong><small>{analysis ? `${analysis.signals.length} signal(s) detected` : "Awaiting log analysis"}</small></div>
          <div className="metric-card"><div className="metric-icon blue"><ShieldCheck size={17}/></div><span>AI assistance</span><strong>RAG enabled</strong><small>Runbook-grounded answers</small></div>
        </section>

        <div className="content-grid">
          <section className="panel log-panel">
            <div className="panel-heading"><div><div className="panel-title"><Terminal size={17}/> Log analyzer</div><p>Upload a log file or paste text to detect common failure patterns.</p></div><span className="step">01 / INPUT</span></div>
            <div className="editor-label"><span>APPLICATION LOGS</span><div className="log-actions"><label className="upload-button"><Upload size={13}/> {uploading ? "Reading file..." : "Choose log file"}<input type="file" accept=".log,.txt,.json,.jsonl,.csv,text/plain,application/json,text/csv" onChange={handleFileUpload} disabled={uploading}/></label><button onClick={() => { setLogs(sampleLogs); setSelectedFile("Built-in sample logs"); setUploadError(""); }}>Load sample</button></div></div>
            {selectedFile && <div className="selected-file"><FileText size={13}/>{selectedFile}<button onClick={() => { setLogs(""); setSelectedFile(""); setAnalysis(null); setChat(null); }}>Clear</button></div>}
            {uploadError && <div className="upload-error" role="alert">{uploadError}</div>}
            <textarea className="log-editor" value={logs} onChange={(e) => setLogs(e.target.value)} spellCheck="false" placeholder="Paste your application logs here..."/>
            <div className="editor-footer"><span>{logs.length.toLocaleString()} characters</span><span>Text logs · Upload limit 1 MB</span></div>
            <button className="primary-button" onClick={analyze} disabled={loadingAnalysis || uploading || logs.trim().length < 5}>
              {loadingAnalysis ? <LoaderCircle className="spin" size={16}/> : <Activity size={16}/>}
              {loadingAnalysis ? "Analyzing logs..." : "Analyze logs"}
            </button>

            {analysis && <div className="analysis-result">
              <div className="result-head"><div><span className="result-kicker">DIAGNOSTIC RESULT</span><h3>Detected signals</h3></div><span className={`severity ${severity}`}>{severity} severity</span></div>
              <p className="summary">{analysis.summary}</p>
              {analysis.signals.length > 0 && <div className="signal-list">{analysis.signals.map((s) => <div className="signal" key={s}><AlertCircle size={14}/>{s}</div>)}</div>}
              <h4>Suggested investigation</h4>
              <ol className="recommendations">{analysis.recommendations.map((r) => <li key={r}>{r}</li>)}</ol>
            </div>}
          </section>

          <section className="panel assistant-panel">
            <div className="panel-heading"><div><div className="panel-title"><Bot size={18}/> StackSherpa assistant</div><p>Ask questions about the incident and retrieve runbook guidance.</p></div><span className="rag-pill"><span className="status-dot online"></span> RAG ACTIVE</span></div>
            <div className="assistant-intro"><div className="bot-orb"><Bot size={22}/></div><div><strong>What can I help investigate?</strong><p>Answers use retrieved knowledge-base passages. Sources are shown below each response.</p></div></div>
            <div className="prompt-label">SUGGESTED QUESTION</div>
            <button className="suggestion" onClick={() => setQuestion("Why are login requests failing, and what should I investigate first?")}>Why are login requests failing, and what should I investigate first?<ChevronRight size={15}/></button>
            <button className="suggestion" onClick={() => setQuestion("How can I verify whether the database connection pool is exhausted?")}>How can I verify whether the database connection pool is exhausted?<ChevronRight size={15}/></button>
            <div className="prompt-label ask-label">YOUR QUESTION</div>
            <div className="ask-box"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows="3" placeholder="Ask about the incident..."/><button onClick={ask} disabled={loadingChat || !question.trim()} aria-label="Send question">{loadingChat ? <LoaderCircle className="spin" size={17}/> : <Send size={17}/>}</button></div>
            {chat && <div className="chat-result">
              <div className="chat-result-head"><CheckCircle2 size={15}/><strong>Assistant response</strong><span>{chat.mode}</span></div>
              <div className="answer">{chat.answer}</div>
              {chat.sources?.length > 0 && <div className="sources"><h4><FileText size={14}/> Retrieved sources</h4>{chat.sources.map((s, i) => <div className="source" key={`${s.file}-${i}`}><strong>{s.file}</strong><p>{s.excerpt}</p></div>)}</div>}
            </div>}
          </section>
        </div>

        <section className="knowledge-section" id="knowledge">
          <div className="section-heading"><div><div className="panel-title"><FileText size={17}/> Knowledge base</div><p>Markdown runbooks indexed into the vector database.</p></div><span className="indexed"><CheckCircle2 size={14}/> Backend ingestion on startup</span></div>
          <div className="knowledge-grid">
            {["database_troubleshooting.md", "authentication.md", "rate_limits.md"].map((file, i) => <div className="knowledge-card" key={file}><div className="file-icon"><FileText size={17}/></div><div><strong>{file}</strong><small>{["Database connectivity and pool limits","JWT, 401 and login failures","429 responses and upstream issues"][i]}</small></div><CheckCircle2 size={15} className="file-check"/></div>)}
          </div>
        </section>
        <footer><span>StackSherpa · Built for learning AI + full-stack engineering</span><span><CircleHelp size={13}/> Demo only. Never submit secrets or unredacted customer logs.</span></footer>
      </main>
    </div>
  );
}
