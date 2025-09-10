"use client";

import { useState } from "react";

export default function FileUploadSection() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const handleUpload = async (endpoint: string) => {
    if (files.length === 0) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    setLoading(endpoint);
    setResponse(null);

    try {
      const res = await fetch(`http://127.0.0.1:5000/upload/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setResponse({ type: endpoint, data });
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setLoading(null);
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
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
      <h1 className="text-2xl font-bold text-indigo-600 text-center mb-6">
        Upload & Run Checks
      </h1>

      {/* File Input */}
      <input
        type="file"
        accept=".pdf,.docx"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        className="w-full mb-4 border border-gray-300 p-2 rounded"
      />

      {/* Display Selected Files */}
      {files.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h3 className="font-semibold mb-2">
            Selected Files ({files.length})
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            {files.map((file, i) => (
              <li key={i}>
                <span className="font-medium">{file.name}</span> —{" "}
                {formatFileSize(file.size)} — Last modified:{" "}
                {new Date(file.lastModified).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid gap-3">
        <button
          onClick={() => handleUpload("plagiarism")}
          disabled={loading !== null}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading === "plagiarism" ? "Checking..." : "Check Plagiarism"}
        </button>

        <button
          onClick={() => handleUpload("ai")}
          disabled={loading !== null}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading === "ai" ? "Checking..." : "Check AI Detection"}
        </button>

        <button
          onClick={() => handleUpload("analysis")}
          disabled={loading !== null}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading === "analysis" ? "Running..." : "Run Analysis"}
        </button>
      </div>

      {/* Results */}
      {response && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-inner">
          <h2 className="text-lg font-bold mb-2 text-gray-700">📊 Results</h2>

          {/* Plagiarism */}
          {response.type === "plagiarism" &&
            response.data.results?.length > 0 && (
              <>
                <p>
                  <span className="font-semibold">Plagiarism Score:</span>{" "}
                  {response.data.results[0].plagiarism_score}%
                </p>
                {response.data.results[0].matches?.length > 0 && (
                  <table className="mt-3 w-full border border-gray-300 rounded">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 border">Source</th>
                        <th className="p-2 border">Match %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {response.data.results[0].matches.map(
                        (m: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-2 border">{m.source}</td>
                            <td className="p-2 border text-center">{m.match}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </>
            )}

          {/* AI Detection */}
          {response.type === "ai" && (
            <>
              <p>
                <span className="font-semibold">AI Score:</span>{" "}
                {response.data.ai_score}%
              </p>
              <p>
                <span className="font-semibold">Result:</span>{" "}
                {response.data.result}
              </p>
            </>
          )}

          {/* File Analysis */}
          {response.type === "analysis" && (
            <div>
              <p>
                <span className="font-semibold">Metadata:</span>{" "}
                {response.data.analysis.metadata}
              </p>
              <p>
                <span className="font-semibold">Structure:</span>{" "}
                {response.data.analysis.structure}
              </p>
              <p>
                <span className="font-semibold">Style:</span>{" "}
                {response.data.analysis.style}
              </p>
            </div>
          )}

          {/* Uploaded Files */}
          {response.data.files && (
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Uploaded Files</h3>
              <ul className="list-disc list-inside text-gray-700">
                {response.data.files.map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
