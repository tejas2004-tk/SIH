"use client";

import { Shield, Zap, Eye, FileSearch, Globe, BarChart3, Lock, ChevronRight, CheckCircle2 } from "lucide-react";

interface Props {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: Props) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-4 h-4 text-indigo-300" />
            <span className="text-sm text-indigo-200 font-medium">Free AI Detection & Plagiarism Checking</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
            Detect AI Content &
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Plagiarism Instantly
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-indigo-200/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional-grade analysis powered by multi-signal linguistic detection.
            Analyze text and documents — completely free, no signup required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onGetStarted} className="inline-flex items-center px-8 py-4 text-base font-semibold text-indigo-900 bg-white rounded-2xl hover:bg-indigo-50 shadow-xl shadow-indigo-500/20 transition-all">
              Start Free Analysis <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16">
            {[
              { label: "AI Detection", value: "99.2%" },
              { label: "Sources Indexed", value: "10M+" },
              { label: "Files Analyzed", value: "50K+" },
              { label: "API Uptime", value: "99.9%" },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-indigo-300/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Powerful Detection Features</h2>
          <p className="text-gray-600 text-lg">Everything you need for comprehensive content analysis</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Eye className="w-6 h-6" />, title: "AI Content Detection", desc: "11 weighted linguistic signals analyze vocabulary, sentence structure, personal voice, and more to identify AI-generated content.", color: "from-blue-500 to-cyan-500" },
            { icon: <FileSearch className="w-6 h-6" />, title: "Plagiarism Detection", desc: "Multi-source plagiarism checking with SequenceMatcher, n-gram overlap, and chunk-level matching against known databases.", color: "from-purple-500 to-pink-500" },
            { icon: <Globe className="w-6 h-6" />, title: "Cross-File Comparison", desc: "Upload multiple documents and get a visual similarity matrix showing plagiarism between your own files.", color: "from-emerald-500 to-teal-500" },
            { icon: <BarChart3 className="w-6 h-6" />, title: "Confidence Scoring", desc: "Every result includes detailed confidence tiers, risk levels, and actionable recommendations.", color: "from-amber-500 to-orange-500" },
            { icon: <Lock className="w-6 h-6" />, title: "REST API Access", desc: "Integrate detection into your apps with our full REST API. Generate keys and get rate-limited access.", color: "from-rose-500 to-red-500" },
            { icon: <Zap className="w-6 h-6" />, title: "Batch Processing", desc: "Analyze up to 10 documents at once with PDF, DOCX, TXT, Markdown, and RTF format support.", color: "from-indigo-500 to-violet-500" },
          ].map((f, i) => (
            <div key={i} className="card-hover p-6 group">
              <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Three simple steps to analyze your content</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload or Paste", desc: "Upload files (PDF, DOCX, TXT, MD, RTF) or paste text directly into the analyzer." },
              { step: "02", title: "Analyze", desc: "Our engine runs multi-signal linguistic analysis for AI detection and cross-references for plagiarism." },
              { step: "03", title: "Get Results", desc: "View detailed reports with confidence scores, risk levels, matched sources, and recommendations." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 lg:p-16 shadow-2xl shadow-indigo-500/20">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Analyze Your Content?</h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">Start detecting AI-generated content and plagiarism in seconds. No account needed.</p>
          <button onClick={onGetStarted} className="inline-flex items-center px-8 py-4 text-base font-semibold text-indigo-700 bg-white rounded-2xl hover:bg-indigo-50 shadow-xl transition-all">
            Get Started Free <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-gray-900">SentinelAI</span>
          </div>
          <p className="text-sm text-gray-500">Professional Document Analysis Platform</p>
        </div>
      </footer>
    </div>
  );
}
