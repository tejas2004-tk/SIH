"use client";
import React, { useState } from "react";

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [response, setResponse] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []));
  };

  const handleUpload = async (endpoint: string) => {
    if (files.length === 0) return alert("Please select a file");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch(`http://127.0.0.1:5000/upload/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
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
    <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">
        Upload & Check Files
      </h2>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="mb-4 border border-gray-300 p-2 rounded w-full"
      />

      {/* Display Selected Files */}
      {files.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-semibold mb-2">Selected Files ({files.length})</h4>
          <ul className="list-disc list-inside text-gray-700">
            {files.map((file, i) => (
              <li key={i}>
                <span className="font-medium">{file.name}</span> — {formatFileSize(file.size)} — Last modified: {file.lastModifiedDate?.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex space-x-4 justify-center mb-4">
        <button
          onClick={() => handleUpload("plagiarism")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
        >
          Check Plagiarism
        </button>
        <button
          onClick={() => handleUpload("ai")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow"
        >
          Check AI Detection
        </button>
        <button
          onClick={() => handleUpload("analysis")}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow"
        >
          Run Analysis
        </button>
      </div>

      {response && (
        <div className="mt-6">
          {/* ✅ Display Summary */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-gray-700">Results</h3>
            {response.plagiarism_score && (
              <p className="mt-2">
                <span className="font-semibold">Plagiarism Score:</span>{" "}
                {response.plagiarism_score}
              </p>
            )}
            {response.ai_score && (
              <p className="mt-2">
                <span className="font-semibold">AI Score:</span>{" "}
                {response.ai_score} → {response.result}
              </p>
            )}
          </div>

          {/* ✅ Table for Matches */}
          {response.matches && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Detected Matches</h4>
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
            </div>
          )}

          {/* ✅ File List */}
          {response.files && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Uploaded Files</h4>
              <ul className="list-disc pl-6 text-gray-700">
                {response.files.map((f: string, i: number) => (
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
