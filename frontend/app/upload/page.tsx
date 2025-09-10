"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Select a file first!");

    const formData = new FormData();
    formData.append("files", file); // ✅ backend expects "files"

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/upload/plagiarism", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-lg w-full bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-indigo-600 mb-6">
          Upload & Check Plagiarism
        </h1>

        {/* File Input */}
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full mb-4 border border-gray-300 p-2 rounded"
        />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check Plagiarism"}
        </button>

        {/* Results */}
        {response && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-inner">
            <h2 className="text-lg font-bold mb-2 text-gray-700">
              📊 Plagiarism Results
            </h2>

            {/* ✅ Score Circle */}
            {response.plagiarism_score && (
              <div className="mb-4 flex flex-col items-center">
                <span className="font-semibold text-gray-700 mb-2">
                  Plagiarism Score
                </span>
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#4f46e5"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={
                        2 * Math.PI * 40 -
                        (parseInt(response.plagiarism_score) / 100) *
                          (2 * Math.PI * 40)
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-indigo-600">
                    {response.plagiarism_score}
                  </span>
                </div>
              </div>
            )}

            {/* ✅ Matches Table */}
            {response.matches && response.matches.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Detected Matches</h3>
                <table className="w-full border border-gray-300 rounded">
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
              </div>
            )}

            {/* ✅ Uploaded Files */}
            {response.files && (
              <div className="mt-4">
                <h3 className="font-semibold mb-1">Uploaded Files</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {response.files.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
