import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import PdfPage from "./PdfPage";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const KEYWORDS = ["invoice", "date", "total"];

export default function OCRViewer({ file, serverData, onDataChange }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const loadedRef = useRef(null);
  const [boxes, setBoxes] = useState([]);
  const [fullText, setFullText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [isPdf, setIsPdf] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const imageUrl =
    file && !file?.type.includes("pdf") ? URL.createObjectURL(file) : null;

  // Load data from serverData
  useEffect(() => {
    if (!serverData) {
      console.log("No serverData provided");
      return;
    }
    const key = file?.name;
    if (loadedRef.current === key) return;
    loadedRef.current = key;

    const pages = serverData.pages || [
      {
        boxes: serverData.boxes || [],
        width: serverData.width,
        height: serverData.height,
        text: serverData.text,
      },
    ];
    const incomingBoxes = pages.flatMap((page, pageIndex) =>
      (page.boxes || []).map((b, idx) => ({
        id: `${pageIndex}-${b.id ?? idx}`,
        text: b.text ?? "",
        x: b.x ?? 0,
        y: b.y ?? 0,
        w: b.w ?? 0,
        h: b.h ?? 0,
        confidence: b.confidence ?? null,
        page: page.page || 1,
      }))
    );
    setBoxes(incomingBoxes);
    setFullText(pages.map((p) => p.text || "").join("\n\n"));
    setIsLoading(false);
    if (pages[0]?.width && pages[0]?.height) {
      setNaturalSize({ w: pages[0].width, h: pages[0].height });
    }
    setIsPdf(file?.type.includes("pdf") || serverData.pages?.length > 0);
    setNumPages(pages.length || 1);
    if (file?.type.includes("pdf")) {
      setPdfPages(
        Array.from({ length: pages.length || 1 }, (_, i) => ({
          pageNum: i + 1,
        }))
      );
    } else {
      setPdfPages([]);
    }
    console.log("Loaded serverData:", {
      pages,
      incomingBoxes,
      isPdf: file?.type.includes("pdf") || serverData.pages?.length > 0,
    });
  }, [serverData, file]);

  // Reset pdfPages when file changes
  useEffect(() => {
    setPdfPages([]);
    loadedRef.current = null;
    setBoxes([]); 
    setIsLoading(true);
    setFullText("");
  }, [file]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Handle image load to get natural size
  const handleImgLoad = (e) => {
    const img = e.target;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    const rect = img.getBoundingClientRect();
    setDisplaySize({ w: rect.width, h: rect.height });
  };

  // handle window resize for PNG image
  useEffect(() => {
    if (!isPdf) {
      const onResize = () => {
        const img = imgRef.current;
        if (!img) return;
        const rect = img.getBoundingClientRect();
        setDisplaySize({ w: rect.width, h: rect.height });
        console.log("Window resized, new displaySize:", {
          w: rect.width,
          h: rect.height,
        });
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [isPdf]);

  const scaleX = isPdf ? 1 : naturalSize.w ? displaySize.w / naturalSize.w : 1;
  const scaleY = isPdf ? 1 : naturalSize.h ? displaySize.h / naturalSize.h : 1;

  const startEdit = (box) => {
    setEditingId(box.id);
    setEditingValue(box.text);
  };

  const commitEdit = () => {
    if (editingId === null) return;
    const newBoxes = boxes.map((b) =>
      b.id === editingId ? { ...b, text: editingValue } : b
    );
    setBoxes(newBoxes);
    if (onDataChange) {
      const updatedPages = serverData.pages?.map((page) => ({
        ...page,
        boxes: newBoxes
          .filter((b) => b.page === page.page)
          .map((b) => ({
            id: parseInt(b.id.split("-")[1]),
            text: b.text,
            x: b.x,
            y: b.y,
            w: b.w,
            h: b.h,
            confidence: b.confidence,
          })),
        text: fullText.split("\n\n")[page.page - 1] || page.text,
      })) || [
        {
          boxes: newBoxes,
          text: fullText,
          width: naturalSize.w,
          height: naturalSize.h,
        },
      ];
      onDataChange({ ...serverData, pages: updatedPages });
    }
    setEditingId(null);
  };

  const onInputKey = (e) => {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") setEditingId(null);
  };

  const onFullTextChange = (val) => {
    setFullText(val);
  };

  const isKeyword = (text) => {
    if (!text) return false;
    const t = text.toLowerCase();
    return KEYWORDS.some((k) => t.includes(k));
  };

  return (
    <div className="ocr-viewer" style={{ display: "flex", gap: "20px" }}>
      <div
        className="image-wrapper"
        ref={containerRef}
        style={{ position: "relative", display: "inline-block" }}
      >
        {!isPdf && imageUrl && (
          <>
            <img
              ref={imgRef}
              src={imageUrl}
              alt="preview"
              onLoad={handleImgLoad}
              className="preview-image"
              style={{ maxWidth: "100%", display: "block", userSelect: "none" }}
            />
            {boxes
              .filter((b) => b.page === 1 && isKeyword(b.text))
              .map((box) => {
                const left = box.x * scaleX;
                const top = box.y * scaleY;
                const width = box.w * scaleX;
                const height = box.h * scaleY;
                return (
                  <div
                    key={box.id}
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width,
                      height,
                      backgroundColor: "rgba(255, 255, 0, 0.4)",
                      pointerEvents: "auto",
                      zIndex: 10,
                      borderRadius: "2px",
                    }}
                    title={box.text}
                    onDoubleClick={() => startEdit(box)}
                  >
                    {editingId === box.id && (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={onInputKey}
                        onBlur={commitEdit}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "1px solid blue",
                          background: "white",
                          fontSize: `${height * 0.8}px`,
                        }}
                        autoFocus
                      />
                    )}
                  </div>
                );
              })}
          </>
        )}
        {isPdf &&
          pdfPages.map((page) => {
            const pageData =
              serverData?.pages?.find((p) => p.page === page.pageNum) || {};
            return (
              <PdfPage
                key={page.pageNum}
                pageNum={page.pageNum}
                file={file}
                pageWidth={pageData.width}
                pageHeight={pageData.height}
                boxes={boxes}
                scale={scale}
                editingId={editingId}
                editingValue={editingValue}
                startEdit={startEdit}
                commitEdit={commitEdit}
                onInputKey={onInputKey}
                isKeyword={isKeyword}
              />
            );
          })}
        {error && <div style={{ color: "red" }}>{error}</div>}
      </div>

      <div className="text-panel" style={{ flex: 1 }}>
        <h3>Extracted Text</h3>
        <textarea
          className="full-textarea"
          value={isLoading ? "" : fullText}
          onChange={(e) => onFullTextChange(e.target.value)}
          placeholder="Full OCR text (editable)"
          style={{ width: "100%", height: "300px" }}
        />
        {/* {isPdf && (
          <div>
            <label>Scale: </label>
            <input
              type="number"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              min="0.5"
              max="3"
            />
          </div>
        )} */}
        <div className="hint">
          Highlight for keywords:{" "}
          {KEYWORDS.map((word, idx) => (
            <span key={word}>
              <b>{word}</b>
              {idx < KEYWORDS.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
