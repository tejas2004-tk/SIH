export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// Public Analysis (Free — No Auth Required)
// ==========================================

export async function publicAnalyzeAI(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const response = await fetch(`${API_BASE}/public/analyze/ai`, { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Analysis failed");
  return data;
}

export async function publicAnalyzePlagiarism(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const response = await fetch(`${API_BASE}/public/analyze/plagiarism`, { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Analysis failed");
  return data;
}

export async function publicAnalyzeComprehensive(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const response = await fetch(`${API_BASE}/public/analyze/comprehensive`, { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Analysis failed");
  return data;
}

export async function publicAnalyzeCrossFile(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  const response = await fetch(`${API_BASE}/public/analyze/cross-file`, { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Cross-file analysis failed");
  return data;
}

export async function publicAnalyzeText(text: string, type: "ai" | "plagiarism" | "comprehensive") {
  const blob = new Blob([text], { type: "text/plain" });
  const file = new File([blob], "pasted_text.txt", { type: "text/plain" });
  const formData = new FormData();
  formData.append("files", file);
  let endpoint = `/public/analyze/${type}`;
  const response = await fetch(`${API_BASE}${endpoint}`, { method: "POST", body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || "Analysis failed");
  return data;
}

// ==========================================
// API Key Auth Functions
// ==========================================

export async function verifyApiKey(apiKey: string) {
  const response = await fetch(`${API_BASE}/api-key/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Invalid API key");
  return data;
}

export async function generateApiKey(userName: string, organization: string, dailyLimit: number) {
  const response = await fetch(`${API_BASE}/api-key/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: userName, organization: organization || "Unknown", daily_limit: dailyLimit }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to generate API key");
  return data;
}

// ==========================================
// Protected API Endpoints (Require Key)
// ==========================================

export async function apiFetchSubmissions(apiKey: string, limit = 50, offset = 0) {
  const response = await fetch(`${API_BASE}/submissions?limit=${limit}&offset=${offset}`, {
    headers: { "X-API-Key": apiKey },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch submissions");
  return data;
}

// ==========================================
// Helpers
// ==========================================

export function getScoreColor(score: number): string {
  if (score < 15) return "text-emerald-600";
  if (score < 30) return "text-amber-600";
  if (score < 50) return "text-orange-600";
  return "text-red-600";
}

export function getScoreBg(score: number): string {
  if (score < 15) return "bg-emerald-50 border-emerald-200";
  if (score < 30) return "bg-amber-50 border-amber-200";
  if (score < 50) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}

export function getScoreGradient(score: number): string {
  if (score < 15) return "from-emerald-500 to-green-500";
  if (score < 30) return "from-amber-500 to-yellow-500";
  if (score < 50) return "from-orange-500 to-red-400";
  return "from-red-500 to-rose-600";
}

export function getRiskBadge(risk: string): string {
  const r = risk?.toLowerCase() || "";
  if (r.includes("low")) return "badge-green";
  if (r.includes("moderate")) return "badge-yellow";
  if (r.includes("high")) return "badge-red";
  if (r.includes("critical")) return "bg-red-200 text-red-900 badge";
  return "badge-blue";
}

export function getConfidenceTier(tier: string): string {
  const t = tier?.toLowerCase() || "";
  if (t.includes("very high")) return "badge-green";
  if (t.includes("high")) return "badge-blue";
  if (t.includes("moderate")) return "badge-yellow";
  return "badge-red";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
