"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, CheckCircle, Shield, FileText, Search, Bot, BarChart3, Eye, Download, AlertTriangle, X, File, Plus, Trash2 } from "lucide-react";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('home');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sections = [
    { id: 'home', label: 'Home', icon: <FileText className="w-5 h-5" /> },
    { id: 'plagiarism', label: 'Plagiarism Detection', icon: <Search className="w-5 h-5" /> },
    { id: 'ai-detection', label: 'AI Detection', icon: <Bot className="w-5 h-5" /> },
    { id: 'file-analysis', label: 'File Analysis', icon: <BarChart3 className="w-5 h-5" /> }
  ];

  const renderContent = () => {
    switch(activeSection) {
      case 'home':
        return <HomeSection setActiveSection={setActiveSection} />;
      case 'plagiarism':
        return <PlagiarismSection />;
      case 'ai-detection':
        return <AIDetectionSection />;
      case 'file-analysis':
        return <FileAnalysisSection />;
      default:
        return <HomeSection setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">SIH Dashboard</span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {section.icon}
                  <span className="hidden md:block">{section.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">SIH Dashboard</span>
          </div>
          <p className="text-gray-600">© 2025 SIH Dashboard. Ensuring Academic Integrity with Advanced AI Technology.</p>
        </div>
      </footer>
    </div>
  );
}

// Enhanced File Upload Component
function FileUploadSection({
  title,
  description,
  acceptedTypes,
  maxSize,
  allowMultiple = false,
  icon: Icon,
  gradient,
  buttonText = "Start Analysis",
  onUpload
}: {
  title: string;
  description: string;
  acceptedTypes: string[];
  maxSize: number;
  allowMultiple?: boolean;
  icon: React.ComponentType<any>;
  gradient: string;
  buttonText?: string;
  onUpload?: (files: File[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';
      const sizeValid = file.size <= maxSize * 1024 * 1024;
      const typeValid = acceptedTypes.includes(fileType);
      return sizeValid && typeValid;
    });

    if (uploadMode === 'single') setFiles(validFiles.slice(0, 1));
    else setFiles(prev => [...prev, ...validFiles]);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center text-white mx-auto mb-4`}>
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6">{description}</p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-2">
          Drop your {uploadMode === 'multiple' ? 'files' : 'file'} here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          {acceptedTypes.join(', ').toUpperCase()} • Max {maxSize}MB {uploadMode === 'multiple' ? 'per file' : ''}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={uploadMode === 'multiple'}
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          onChange={e => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8 space-y-3">
          {files.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
              <button onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      {files.length > 0 && (
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => onUpload && onUpload(files)}
            className={`flex-1 bg-gradient-to-r ${gradient} text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all`}
            disabled={loading}
          >
            {buttonText}
          </button>
          <button onClick={() => setFiles([])} className="flex-1 border-2 border-gray-300 py-3 rounded-xl hover:border-red-500 hover:text-red-600 transition-colors font-medium">
            <Trash2 className="w-4 h-4 inline mr-2" /> Clear All
          </button>
        </div>
      )}
    </div>
  );
}


// Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradient, 
  stats 
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  stats: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
      <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center text-white mb-6`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Performance</span>
        <span className={`text-sm font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {stats}
        </span>
      </div>
    </div>
  );
}

// Home Section Component
function HomeSection({ setActiveSection }: { setActiveSection: (section: string) => void }) {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Academic Integrity Platform - Now Live
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Academic Integrity
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Advanced plagiarism detection, AI content identification, and comprehensive file analysis 
            to ensure academic integrity. Trusted by educational institutions worldwide.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <FeatureCard
            icon={<Search className="w-12 h-12" />}
            title="Plagiarism Detection"
            description="Advanced algorithms scan billions of sources to detect copied content with precision."
            gradient="from-red-500 to-pink-500"
            stats="99.9% Accuracy"
          />
          <FeatureCard
            icon={<Bot className="w-12 h-12" />}
            title="AI Content Detection"
            description="Identify AI-generated text from ChatGPT, GPT-4, and other language models."
            gradient="from-purple-500 to-indigo-500"
            stats="Real-time Analysis"
          />
          <FeatureCard
            icon={<BarChart3 className="w-12 h-12" />}
            title="File Analysis"
            description="Comprehensive document analysis with detailed reports and insights."
            gradient="from-blue-500 to-cyan-500"
            stats="Multi-format Support"
          />
        </div>

        {/* Quick Upload Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12 text-center">
          <Upload className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Choose a specific tool above or upload your document here for a quick analysis preview.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveSection('plagiarism')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-colors"
            >
              <Search className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <span className="font-medium text-gray-900">Check Plagiarism</span>
            </button>
            <button 
              onClick={() => setActiveSection('ai-detection')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <Bot className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <span className="font-medium text-gray-900">Detect AI Content</span>
            </button>
            <button 
              onClick={() => setActiveSection('file-analysis')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <span className="font-medium text-gray-900">Analyze Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Plagiarism Section Component
// Plagiarism Section Component (Updated with frontend file preview)
function PlagiarismSection() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return alert("Please select a file");

    setUploadedFiles(files);
    setLoading(true);

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {
      const res = await fetch(`http://127.0.0.1:5000/upload/plagiarism`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      alert("Plagiarism check failed!");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Plagiarism <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Detection</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Advanced plagiarism detection technology that scans billions of sources to ensure content originality.
          </p>
        </div>

        {/* Upload Section */}
        <FileUploadSection
          title="Upload Documents for Plagiarism Check"
          description="Upload single or multiple documents to check for plagiarism across billions of sources including web pages, academic papers, and databases."
          acceptedTypes={['pdf', 'docx', 'txt']}
          maxSize={10}
          allowMultiple={true}
          icon={Search}
          gradient="from-red-500 to-pink-500"
          buttonText={loading ? "Checking..." : "Check for Plagiarism"}
          onUpload={handleUpload}
        />

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">Selected Files</h3>
            <ul className="list-disc list-inside text-gray-700">
              {uploadedFiles.map((file, i) => (
                <li key={i}>
                 <li key={i}>
  {file.name} — {formatFileSize(file.size)} — Last modified: {new Date(file.lastModified).toLocaleString()}
</li>

                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Display Results */}
        {response && (
          <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Plagiarism Results</h3>
            {response.overall_similarity && (
              <p className="mb-4">
                <span className="font-semibold">Overall Similarity:</span> {response.overall_similarity}%
              </p>
            )}

            {response.matches && response.matches.length > 0 && (
              <table className="w-full border border-gray-300 rounded-lg">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 border">Source</th>
                    <th className="p-2 border">Match %</th>
                  </tr>
                </thead>
                <tbody>
                  {response.matches.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 border">{m.source}</td>
                      <td className="p-2 border text-center">{m.match}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// AI Detection Section Component
function AIDetectionSection() {
  const handleUpload = (files: File[]) => {
    console.log('AI detection files:', files);
    // Handle AI detection upload
  };

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI Content <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">Detection</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Identify AI-generated content from ChatGPT, GPT-4, Claude, and other language models with high accuracy.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-20">
          <FileUploadSection
            title="Upload Documents for AI Detection"
            description="Upload single or multiple documents to analyze and detect AI-generated content from various language models including ChatGPT, GPT-4, Claude, and Bard."
            acceptedTypes={['pdf', 'docx', 'txt']}
            maxSize={10}
            allowMultiple={true}
            icon={Bot}
            gradient="from-purple-500 to-indigo-500"
            buttonText="Analyze AI Content"
            onUpload={handleUpload}
          />
        </div>

        {/* Results Preview + Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* AI Detection Preview */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white">
              <h3 className="text-xl font-bold">AI Detection Analysis</h3>
              <p className="text-purple-100">Content Authenticity Check</p>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-16 h-16 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-purple-600 mb-2">92%</div>
                <div className="text-gray-600">Likely AI-Generated</div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Human-like patterns</span>
                  <span className="text-sm text-gray-500">8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '8%'}}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AI-like patterns</span>
                  <span className="text-sm text-purple-600">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{width: '92%'}}></div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">AI Detection Alert</span>
                </div>
                <p className="text-sm text-purple-700">This content shows strong indicators of AI generation from models like GPT-3/4.</p>
              </div>
              
              <button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                <Eye className="w-4 h-4 inline mr-2" />
                View Detailed Analysis
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Advanced AI Detection</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Multi-Model Detection</h3>
                  <p className="text-gray-600">Detects content from ChatGPT, GPT-4, Claude, Bard, and other AI models</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Confidence Scoring</h3>
                  <p className="text-gray-600">Provides percentage confidence levels for AI vs. human-written content</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Content Protection</h3>
                  <p className="text-gray-600">Ensures that original content is not misused or plagiarized</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>  
  );
}
/* ---------------- FILE ANALYSIS SECTION (ADDED) ---------------- */
function FileAnalysisSection() {
  const handleUpload = (files: File[]) => {
    console.log("File analysis files:", files);
  };

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            File <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Analysis</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Upload documents for deep structural, semantic, and metadata analysis with actionable insights.
          </p>
        </div>

        <FileUploadSection
          title="Upload Documents for Analysis"
          description="Upload PDF, DOCX, or TXT files for analysis of formatting, metadata, writing style, and structure."
          acceptedTypes={['pdf', 'docx', 'txt']}
          maxSize={15}
          allowMultiple={true}
          icon={BarChart3}
          gradient="from-blue-500 to-cyan-500"
          buttonText="Run File Analysis"
          onUpload={handleUpload}
        />

        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-white rounded-2xl shadow-lg border">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Preview</h3>
            <ul className="space-y-3 text-gray-600">
              <li>✔ Metadata extracted successfully</li>
              <li>✔ Structural integrity check passed</li>
              <li>✔ Writing style analyzed</li>
            </ul>
          </div>
          <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white shadow-lg">
            <h3 className="text-xl font-bold mb-4">Next Steps</h3>
            <p className="mb-4">Download the complete analysis report for detailed insights.</p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all">
              <Download className="w-4 h-4 inline mr-2" /> Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

