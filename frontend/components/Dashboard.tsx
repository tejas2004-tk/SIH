"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Eye, FileSearch, History, Key, BarChart3, Home, Upload, Type,
  Loader2, FileText, X, AlertCircle, CheckCircle2, Copy, Check,
  Download, Layers, AlertTriangle, Shield, ChevronDown, Lock
} from "lucide-react";
import {
  publicAnalyzeAI, publicAnalyzePlagiarism, publicAnalyzeComprehensive,
  publicAnalyzeCrossFile, publicAnalyzeText,
  generateApiKey, verifyApiKey, apiFetchSubmissions,
  getScoreColor, getRiskBadge, getConfidenceTier,
  formatFileSize, formatDate, API_BASE,
} from "../lib/api";

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

function saveToHistory(entry: any) {
  const history = JSON.parse(localStorage.getItem("sentinel_history") || "[]");
  history.unshift({ ...entry, time: new Date().toISOString() });
  localStorage.setItem("sentinel_history", JSON.stringify(history.slice(0, 100)));
}

function saveReport(entry: any) {
  const reports = JSON.parse(localStorage.getItem("sentinel_reports") || "[]");
  reports.unshift({ ...entry, timestamp: new Date().toISOString() });
  localStorage.setItem("sentinel_reports", JSON.stringify(reports.slice(0, 50)));
}

type Tab = "home" | "ai" | "plagiarism" | "reports" | "api" | "history";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "home", label: "Overview", icon: Home },
    { id: "ai", label: "AI Detection", icon: Eye },
    { id: "plagiarism", label: "Plagiarism", icon: FileSearch },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "api", label: "API Integration", icon: Key },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === tab.id ? "text-indigo-600 border-indigo-600" : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "home" && <HomeTab onNavigate={setActiveTab} />}
        {activeTab === "ai" && <AITab />}
        {activeTab === "plagiarism" && <PlagiarismTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "api" && <APITab />}
        {activeTab === "history" && <HistoryTab />}
      </div>
    </div>
  );
}

// ==========================================
// HOME TAB
// ==========================================

function HomeTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to SentinelAI</h1>
        <p className="text-gray-600">Professional AI detection and plagiarism checking — completely free.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {[
          { tab: "ai" as Tab, icon: <Eye className="w-6 h-6" />, title: "AI Detection", desc: "Paste text or upload files to detect AI-generated content using 11 linguistic signals.", gradient: "from-blue-500 to-cyan-500", badge: "Free" },
          { tab: "plagiarism" as Tab, icon: <FileSearch className="w-6 h-6" />, title: "Plagiarism Check", desc: "Upload documents for plagiarism analysis with cross-file comparison matrix.", gradient: "from-purple-500 to-pink-500", badge: "Free" },
          { tab: "api" as Tab, icon: <Key className="w-6 h-6" />, title: "API Integration", desc: "Generate API keys and integrate detection into your own applications.", gradient: "from-emerald-500 to-teal-500", badge: "Auth Required" },
        ].map((c, i) => (
          <button key={i} onClick={() => onNavigate(c.tab)} className="card-hover p-6 text-left group relative">
            <span className="absolute top-4 right-4 badge-blue text-xs">{c.badge}</span>
            <div className={`w-12 h-12 bg-gradient-to-br ${c.gradient} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>{c.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{c.title}</h3>
            <p className="text-sm text-gray-600">{c.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "AI Signals", value: "11", desc: "Linguistic detectors" },
          { label: "File Formats", value: "5", desc: "PDF, DOCX, TXT, MD, RTF" },
          { label: "Batch Limit", value: "10", desc: "Files per request" },
          { label: "Analysis", value: "Free", desc: "No signup needed" },
        ].map((s, i) => (
          <div key={i} className="card p-5 text-center">
            <p className="text-2xl font-bold text-indigo-600">{s.value}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{s.label}</p>
            <p className="text-xs text-gray-500">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Supported File Formats</h2>
        <div className="flex flex-wrap gap-3">
          {["PDF", "DOCX", "TXT", "Markdown", "RTF"].map((fmt) => (
            <div key={fmt} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">.{fmt.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SHARED: FILE UPLOAD ZONE
// ==========================================

function FileDropZone({ files, setFiles, accept }: { files: File[]; setFiles: (f: File[]) => void; accept?: string }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const acceptExt = accept || ".pdf,.docx,.txt,.md,.rtf";

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter(f => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      return acceptExt.split(",").map(a => a.trim()).includes(ext);
    });
    setFiles([...files, ...arr].slice(0, 10));
  }, [files, setFiles, acceptExt]);

  return (
    <div>
      <div
        className={`drop-zone ${dragActive ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700">Drop files here or click to browse</p>
        <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, Markdown, RTF — Max 10 files</p>
        <input ref={inputRef} type="file" multiple accept={acceptExt} className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
      </div>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">{f.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(f.size)}</span>
              </div>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-1 hover:bg-gray-200 rounded flex-shrink-0">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// AI DETECTION TAB
// ==========================================

function AITab() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleTextAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(""); setResults(null);
    try {
      const res = await publicAnalyzeText(text, "ai");
      setResults(res);
      const r = res.results?.[0];
      if (r?.status === "success") {
        saveToHistory({ filename: "Pasted Text", type: "AI Detection", ai_score: r.ai_detection?.score });
        saveReport({ filename: "Pasted Text", type: "AI Detection", ai_score: r.ai_detection?.score, full: r });
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleFileAnalyze = async () => {
    if (files.length === 0) return;
    setLoading(true); setError(""); setResults(null);
    try {
      const res = await publicAnalyzeAI(files);
      setResults(res);
      res.results?.forEach((r: any) => {
        if (r.status === "success") {
          saveToHistory({ filename: r.filename, type: "AI Detection", ai_score: r.ai_detection?.score });
          saveReport({ filename: r.filename, type: "AI Detection", ai_score: r.ai_detection?.score, full: r });
        }
      });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">AI Content Detection</h1>
          <span className="badge-green">Free</span>
        </div>
        <p className="text-gray-600">Analyze text or upload files to detect AI-generated content using 11 weighted linguistic signals.</p>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setMode("text")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "text" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
          <Type className="w-4 h-4" /> Paste Text
        </button>
        <button onClick={() => setMode("file")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "file" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
          <Upload className="w-4 h-4" /> Upload Files
        </button>
      </div>

      <div className="card p-6">
        {mode === "text" ? (
          <>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              className="w-full h-48 input-field resize-none font-mono text-sm"
              placeholder="Paste your text here for AI detection analysis..." />
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">{wordCount} words</p>
              <button onClick={handleTextAnalyze} disabled={loading || !text.trim()} className="btn-primary disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Eye className="w-4 h-4 mr-2" /> Analyze Text</>}
              </button>
            </div>
          </>
        ) : (
          <>
            <FileDropZone files={files} setFiles={setFiles} />
            {files.length > 0 && (
              <div className="flex justify-end mt-4">
                <button onClick={handleFileAnalyze} disabled={loading} className="btn-primary disabled:opacity-50">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing {files.length} file(s)...</> : <><Eye className="w-4 h-4 mr-2" /> Analyze {files.length} File(s)</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {error && <ErrorAlert message={error} />}
      {results && <AIResults data={results} />}
    </div>
  );
}

function AIResults({ data }: { data: any }) {
  const res = data.results || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">Results</h2>
        <span className="badge-blue">{data.files_processed} file(s) analyzed</span>
      </div>
      {res.map((r: any, i: number) => {
        if (r.status === "error") return <div key={i} className="card p-4 border-red-200 bg-red-50"><p className="text-sm text-red-700 font-medium">{r.filename}: {r.error}</p></div>;
        const ai = r.ai_detection;
        const analysis = r.analysis;
        return (
          <div key={i} className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{r.filename}</h3>
              <span className={getRiskBadge(ai.risk_level)}>{ai.risk_level} Risk</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center"><ScoreRing score={ai.score} /><p className={`text-lg font-bold mt-2 ${getScoreColor(ai.score)}`}>{ai.score.toFixed(1)}%</p><p className="text-xs text-gray-500">AI Probability</p></div>
                <div className="text-center"><ScoreRing score={ai.confidence} color="indigo" /><p className="text-lg font-bold mt-2 text-indigo-600">{ai.confidence.toFixed(1)}%</p><p className="text-xs text-gray-500">Confidence</p></div>
                <div className="flex flex-col items-center justify-center gap-3">
                  <span className={getConfidenceTier(ai.confidence_tier)}>{ai.confidence_tier} Confidence</span>
                  <span className="badge-purple">{ai.classification}</span>
                  <span className="text-sm text-gray-500">Human: {ai.human_score?.toFixed(1)}%</span>
                </div>
              </div>

              {ai.markers?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Detection Markers</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ai.markers.map((m: any, j: number) => (
                      <div key={j} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700">{m.category}</p>
                          <p className="text-xs text-gray-500 truncate">{m.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className={`text-sm font-bold ${getScoreColor(m.score)}`}>{m.score.toFixed(1)}</p>
                          <p className="text-xs text-gray-400">w:{(m.weight * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Text Statistics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Words", value: analysis.word_count },
                      { label: "Sentences", value: analysis.sentence_count },
                      { label: "Lexical Diversity", value: `${analysis.lexical_diversity}%` },
                      { label: "Readability", value: analysis.readability_score },
                    ].map((s, j) => (
                      <div key={j} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                        <p className="text-lg font-bold text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// PLAGIARISM TAB
// ==========================================

function PlagiarismTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [crossResults, setCrossResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setLoading(true); setError(""); setResults(null); setCrossResults(null);
    try {
      const res = await publicAnalyzePlagiarism(files);
      setResults(res);
      res.results?.forEach((r: any) => {
        if (r.status === "success") {
          saveToHistory({ filename: r.filename, type: "Plagiarism", plagiarism_score: r.plagiarism?.score });
          saveReport({ filename: r.filename, type: "Plagiarism", plagiarism_score: r.plagiarism?.score, full: r });
        }
      });
      if (files.length >= 2) {
        try {
          const cross = await publicAnalyzeCrossFile(files);
          setCrossResults(cross.cross_file_analysis);
        } catch {}
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Plagiarism Detection</h1>
          <span className="badge-green">Free</span>
        </div>
        <p className="text-gray-600">Upload documents for plagiarism analysis. Upload 2+ files for cross-file comparison.</p>
      </div>

      <div className="card p-6">
        <FileDropZone files={files} setFiles={setFiles} />
        {files.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">{files.length} file(s) selected{files.length >= 2 ? " — cross-file comparison enabled" : ""}</p>
            <button onClick={handleAnalyze} disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><FileSearch className="w-4 h-4 mr-2" /> Check Plagiarism</>}
            </button>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} />}
      {results && <PlagiarismResults data={results} />}
      {crossResults && <CrossFileMatrix data={crossResults} />}
    </div>
  );
}

function PlagiarismResults({ data }: { data: any }) {
  const res = data.results || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">Plagiarism Results</h2>
        <span className="badge-blue">{data.files_processed} file(s)</span>
      </div>
      {res.map((r: any, i: number) => {
        if (r.status === "error") return <div key={i} className="card p-4 border-red-200 bg-red-50"><p className="text-sm text-red-700">{r.filename}: {r.error}</p></div>;
        const p = r.plagiarism;
        return (
          <div key={i} className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{r.filename}</h3>
              <span className={getRiskBadge(p.risk_level)}>{p.risk_level} Risk</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center"><ScoreRing score={p.score} /><p className={`text-lg font-bold mt-2 ${getScoreColor(p.score)}`}>{p.score.toFixed(1)}%</p><p className="text-xs text-gray-500">Plagiarism</p></div>
                <div className="text-center"><ScoreRing score={p.originality_score} color="emerald" /><p className="text-lg font-bold mt-2 text-emerald-600">{p.originality_score.toFixed(1)}%</p><p className="text-xs text-gray-500">Originality</p></div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className={getConfidenceTier(p.confidence_tier)}>{p.confidence_tier} ({p.confidence.toFixed(0)}%)</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recommendation</p>
                  <p className="text-sm text-gray-700">{p.recommendation}</p>
                </div>
              </div>

              {p.matches?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Matched Sources ({p.matches.length})</h4>
                  <div className="space-y-2">
                    {p.matches.map((m: any, j: number) => (
                      <div key={j} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{m.source}</span>
                            <span className="text-xs text-gray-400">trust: {m.trustworthiness}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-amber-600">{m.similarity.toFixed(1)}%</span>
                            <span className="text-xs text-gray-400">conf: {m.confidence.toFixed(0)}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 italic bg-white rounded-lg p-2 border border-gray-200">&ldquo;{m.matched_text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// CROSS-FILE MATRIX
// ==========================================

function CrossFileMatrix({ data }: { data: any }) {
  if (!data?.pairs?.length) return null;
  return (
    <div className="card overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-600" /> Cross-File Similarity Matrix</h2>
        <p className="text-sm text-gray-500">{data.total_comparisons} comparisons across {data.total_files} files</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100"><p className="text-xl font-bold text-gray-900">{data.overall_cross_similarity.toFixed(1)}%</p><p className="text-xs text-gray-500">Avg Similarity</p></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100"><p className="text-xl font-bold text-gray-900">{data.suspicious_pairs}</p><p className="text-xs text-gray-500">Suspicious Pairs</p></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100"><span className={getRiskBadge(data.risk_level)}>{data.risk_level}</span><p className="text-xs text-gray-500 mt-1">Risk Level</p></div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100"><p className="text-xl font-bold text-gray-900">{data.batch_confidence.toFixed(0)}%</p><p className="text-xs text-gray-500">Confidence</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">File A</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">File B</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Similarity</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Risk</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.pairs.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-700 max-w-[180px] truncate">{p.file_a}</td>
                  <td className="px-4 py-3 font-medium text-gray-700 max-w-[180px] truncate">{p.file_b}</td>
                  <td className="px-4 py-3 text-center"><span className={`font-bold ${getScoreColor(p.similarity)}`}>{p.similarity.toFixed(1)}%</span></td>
                  <td className="px-4 py-3 text-center"><span className={getRiskBadge(p.risk_level)}>{p.risk_level}</span></td>
                  <td className="px-4 py-3 text-center">{p.is_suspicious ? <span className="badge-red">Suspicious</span> : <span className="badge-green">Clean</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// REPORTS TAB
// ==========================================

function ReportsTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sentinel_reports") || "[]");
    setReports(stored);
    setLoading(false);
  }, []);

  const clearReports = () => {
    localStorage.removeItem("sentinel_reports");
    setReports([]);
  };

  const downloadReport = (report: any) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-report-${report.filename || "unknown"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Reports</h1>
          <p className="text-gray-600">Reports from your current session. Export as JSON.</p>
        </div>
        {reports.length > 0 && (
          <button onClick={clearReports} className="btn-ghost text-red-600 hover:text-red-700 text-sm">Clear All</button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No reports yet</p>
          <p className="text-sm text-gray-400">Run an analysis in the AI Detection or Plagiarism tabs to generate reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <div key={i} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{r.filename}</p>
                  <p className="text-xs text-gray-500">{r.type} — {r.timestamp ? formatDate(r.timestamp) : "Just now"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {r.ai_score !== undefined && <div className="text-center"><p className={`font-bold ${getScoreColor(r.ai_score)}`}>{r.ai_score.toFixed(1)}%</p><p className="text-xs text-gray-500">AI</p></div>}
                {r.plagiarism_score !== undefined && <div className="text-center"><p className={`font-bold ${getScoreColor(r.plagiarism_score)}`}>{r.plagiarism_score.toFixed(1)}%</p><p className="text-xs text-gray-500">Plag</p></div>}
                <button onClick={() => downloadReport(r)} className="btn-ghost text-indigo-600 hover:text-indigo-700" title="Export JSON">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// API INTEGRATION TAB
// ==========================================

function APITab() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [org, setOrg] = useState("");
  const [limit, setLimit] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedEndpoint, setCopiedEndpoint] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sentinel_api_key");
    if (saved) { setApiKey(saved); setShowKeyForm(false); }
  }, []);

  const handleGenerate = async () => {
    if (userName.length < 3) { setError("Username must be at least 3 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await generateApiKey(userName, org, limit);
      setApiKey(res.data.key);
      localStorage.setItem("sentinel_api_key", res.data.key);
      setShowKeyForm(false);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(""), 2000);
  };

  const resetKey = () => {
    localStorage.removeItem("sentinel_api_key");
    setApiKey(null);
    setShowKeyForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Integration</h1>
        <p className="text-gray-600">Generate an API key to integrate SentinelAI into your applications.</p>
      </div>

      {showKeyForm && !apiKey ? (
        <div className="card p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Generate API Key</h2>
              <p className="text-sm text-gray-500">Required for programmatic API access</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username *</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="input-field" placeholder="john_doe" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization</label>
              <input type="text" value={org} onChange={(e) => setOrg(e.target.value)} className="input-field" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Daily Request Limit</label>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="input-field">
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000</option>
              </select>
            </div>
          </div>
          {error && <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700">{error}</div>}
          <button onClick={handleGenerate} disabled={loading || userName.length < 3} className="btn-primary w-full mt-6 disabled:opacity-50">
            {loading ? "Generating..." : "Generate API Key"}
          </button>
        </div>
      ) : apiKey ? (
        <>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your API Key</h2>
              <button onClick={resetKey} className="text-sm text-gray-500 hover:text-red-600">Regenerate</button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <code className="flex-1 text-xs font-mono text-gray-800 break-all">{apiKey}</code>
              <button onClick={copyKey} className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors">
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Include in the <code className="bg-gray-100 px-1.5 py-0.5 rounded">X-API-Key</code> header for all protected requests.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Endpoints</h2>
            {[
              { method: "POST", path: "/analyze/plagiarism", desc: "Analyze files for plagiarism (API key required)", curl: `curl -X POST ${API_BASE}/analyze/plagiarism\n  -H "X-API-Key: ${apiKey}"\n  -F "files=@document.pdf"` },
              { method: "POST", path: "/analyze/ai", desc: "Detect AI-generated content (API key required)", curl: `curl -X POST ${API_BASE}/analyze/ai\n  -H "X-API-Key: ${apiKey}"\n  -F "files=@essay.docx"` },
              { method: "POST", path: "/analyze/comprehensive", desc: "Full analysis (API key required)", curl: `curl -X POST ${API_BASE}/analyze/comprehensive\n  -H "X-API-Key: ${apiKey}"\n  -F "files=@paper.pdf"\n  -F "files=@draft.docx"` },
              { method: "POST", path: "/analyze/cross-file", desc: "Cross-file comparison (API key required)", curl: `curl -X POST ${API_BASE}/analyze/cross-file\n  -H "X-API-Key: ${apiKey}"\n  -F "files=@file1.pdf"\n  -F "files=@file2.pdf"` },
              { method: "GET", path: "/submissions", desc: "Get analysis history", curl: `curl -X GET "${API_BASE}/submissions?limit=10"\n  -H "X-API-Key: ${apiKey}"` },
              { method: "POST", path: "/public/analyze/ai", desc: "Free AI detection (no auth)", curl: `curl -X POST ${API_BASE}/public/analyze/ai\n  -F "files=@file.txt"` },
              { method: "POST", path: "/public/analyze/plagiarism", desc: "Free plagiarism check (no auth)", curl: `curl -X POST ${API_BASE}/public/analyze/plagiarism\n  -F "files=@document.pdf"` },
            ].map((ep, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
                  <span className={`badge ${ep.method === "GET" ? "badge-green" : ep.path.startsWith("/public") ? "badge-purple" : "badge-blue"}`}>{ep.method}</span>
                  <code className="text-sm font-bold text-gray-900 font-mono">{ep.path}</code>
                  <span className="text-sm text-gray-500 ml-auto hidden sm:block">{ep.desc}</span>
                </div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 text-xs overflow-x-auto font-mono leading-relaxed">{ep.curl}</pre>
                  <button onClick={() => copyCode(ep.curl, ep.path)} className="absolute top-3 right-3 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg transition-colors">
                    {copiedEndpoint === ep.path ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ==========================================
// HISTORY TAB (from localStorage)
// ==========================================

function HistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sentinel_history") || "[]");
    setHistory(stored);
    setLoading(false);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("sentinel_history");
    setHistory([]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis History</h1>
          <p className="text-gray-600">Session history of all your analyses.</p>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className="btn-ghost text-red-600 hover:text-red-700 text-sm">Clear</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No history yet</p>
          <p className="text-sm text-gray-400">Your analysis history will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">File</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">AI Score</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Plagiarism</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate">{h.filename}</td>
                    <td className="px-6 py-4"><span className="badge-blue">{h.type}</span></td>
                    <td className="px-6 py-4">{h.ai_score !== undefined ? <span className={`font-bold ${getScoreColor(h.ai_score)}`}>{h.ai_score.toFixed(1)}%</span> : "-"}</td>
                    <td className="px-6 py-4">{h.plagiarism_score !== undefined ? <span className={`font-bold ${getScoreColor(h.plagiarism_score)}`}>{h.plagiarism_score.toFixed(1)}%</span> : "-"}</td>
                    <td className="px-6 py-4 text-gray-500">{h.time ? formatDate(h.time) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SHARED COMPONENTS
// ==========================================

function ScoreRing({ score, color = "default" }: { score: number; color?: string }) {
  const r = 40, s = 6, nr = r - s / 2, c = nr * 2 * Math.PI, d = c - (score / 100) * c;
  const stroke = color === "indigo" ? "#6366f1" : color === "emerald" ? "#10b981" : score < 15 ? "#10b981" : score < 30 ? "#f59e0b" : score < 50 ? "#f97316" : "#ef4444";
  return (
    <div className="score-ring inline-flex items-center justify-center relative">
      <svg height={r * 2} width={r * 2} className="-rotate-90">
        <circle stroke="#e5e7eb" fill="transparent" strokeWidth={s} r={nr} cx={r} cy={r} />
        <circle stroke={stroke} fill="transparent" strokeWidth={s} strokeLinecap="round"
          strokeDasharray={`${c} ${c}`} style={{ strokeDashoffset: d, transition: "stroke-dashoffset 1s ease-in-out" }}
          r={nr} cx={r} cy={r} />
      </svg>
      <span className="absolute text-xs font-bold text-gray-700">{score.toFixed(0)}%</span>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0" /> {message}
    </div>
  );
}

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
}
