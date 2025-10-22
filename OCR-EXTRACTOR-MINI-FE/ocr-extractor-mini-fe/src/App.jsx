import React, { useState, useRef } from "react";
import OCRViewer from "./OCRViewer";
import "./index.css";

export default function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null); // response from backend
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  // Upload file to backend /upload
  const handleUpload = async (evt) => {
    const f = evt.target.files?.[0];
    if (!f) return;
    setFile(f);
    setData(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", f);

      // Gọi API backend
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Upload failed");

      const json = await res.json();

      setData(json);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Download current data (boxes + text) as JSON file
  const downloadJSON = (currentData) => {
    if (!currentData) return;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (currentData.fileName || "ocr_result") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>OCR Viewer — Inline Edit Bounding Boxes</h1>
      </header>

      <div className="controls">
        <div className="button-group">
          <div className="buttons-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
            <button
              onClick={() => {
                if (!fileRef.current) return;
                fileRef.current.click();
              }}
              className="file-button"
            >
              Upload File
            </button>

            <button
              onClick={() => downloadJSON(data)}
              disabled={!data}
              title="Download JSON (boxes + text)"
              className="download-button"
            >
              Download JSON
            </button>
          </div>

          {file && (
            <div className="file-info">
              <strong>File:</strong> {file.name} —{" "}
              {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>

        {loading && <span className="loading">Đang xử lý OCR...</span>}
      </div>

      <div className="viewer-area">
        {/* If no data is available, still show image preview */}
        {file && (
          <OCRViewer
            file={file}
            serverData={data}
            onDataChange={(updated) => setData(updated)}
          />
        )}

        {!file && (
          <div className="hint">
            Upload a file to extract text and bounding boxes.
          </div>
        )}
      </div>
    </div>
  );
}
