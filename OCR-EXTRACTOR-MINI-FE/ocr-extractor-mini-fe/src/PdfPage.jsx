import React, { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

const PdfPage = ({
  pageNum,
  file,
  pageWidth,
  pageHeight,
  boxes,
  scale,
  editingId,
  editingValue,
  startEdit,
  commitEdit,
  onInputKey,
  isKeyword,
}) => {
  const containerRef = useRef(null);
  const renderedRef = useRef(null);

  useEffect(() => {
    const renderPage = async () => {
      const key = `${file?.name}-${pageNum}`;
      if (renderedRef.current === key) return;
      renderedRef.current = key;

      try {
        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file))
          .promise;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas to render PDF
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        containerRef.current.appendChild(canvas);

        // Render page into canvas
        const context = canvas.getContext("2d");
        await page.render({ canvasContext: context, viewport }).promise;
        console.log(`Page ${pageNum} rendered`);

        // Get boxes for current page
        if (!pageWidth || !pageHeight) {
          console.warn(`No pageWidth/pageHeight for page ${pageNum}`);
          return;
        }

        const scaleX = viewport.width / pageWidth;
        const scaleY = viewport.height / pageHeight;
        console.log(`Page ${pageNum} scales:`, { scaleX, scaleY });

        // Highlight boxes for keywords
        boxes
          .filter((b) => b.page === pageNum && isKeyword(b.text))
          .forEach((box) => {
            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.left = `${box.x * scaleX}px`;
            div.style.top = `${box.y * scaleY}px`;
            div.style.width = `${box.w * scaleX}px`;
            div.style.height = `${box.h * scaleY}px`;
            div.style.backgroundColor = "rgba(255, 255, 0, 0.4)";
            div.style.pointerEvents = "auto";
            div.style.borderRadius = "2px";
            div.title = box.text;
            div.addEventListener("dblclick", () => startEdit(box));
            if (editingId === box.id) {
              const input = document.createElement("input");
              input.type = "text";
              input.value = editingValue;
              input.style.position = "absolute";
              input.style.left = "0";
              input.style.top = "0";
              input.style.width = "100%";
              input.style.height = "100%";
              input.style.fontSize = `${box.h * scaleY * 0.8}px`;
              input.style.border = "1px solid blue";
              input.style.background = "white";
              input.addEventListener("change", (e) =>
                setEditingValue(e.target.value)
              );
              input.addEventListener("keydown", onInputKey);
              input.addEventListener("blur", commitEdit);
              div.appendChild(input);
              input.focus();
            }
            containerRef.current.appendChild(div);
          });
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    };
    if (file && containerRef.current) {
      containerRef.current.innerHTML = ""; // Clear previous content
      renderPage();
    }
  }, [
    file,
    pageNum,
    scale,
    pageWidth,
    pageHeight,
    boxes,
    editingId,
    editingValue,
    isKeyword,
  ]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", marginBottom: "20px" }}
    />
  );
};

export default PdfPage;
