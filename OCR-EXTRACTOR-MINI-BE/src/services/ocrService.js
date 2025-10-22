import Tesseract from "tesseract.js";
import sharp from "sharp";

export async function runOCROnImage(imagePath) {
  const meta = await sharp(imagePath).metadata();
  const { width, height } = meta;

  const { data } = await Tesseract.recognize(imagePath, "eng", {
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
  });

  const expand = 4; // expand bounding boxes by 4 pixels
  const boxes = (data.words || []).map((w, i) => ({
    id: i,
    text: w.text || "",
    x: Math.max(0, w.bbox.x0 + expand),
    y: Math.max(0, w.bbox.y0 + expand),
    w: w.bbox.x1 - w.bbox.x0 + expand * 2,
    h: w.bbox.y1 - w.bbox.y0,
    confidence: w.confidence,
  }));

  //  const boxes = (data.lines || []).map((line, i) => ({
  //   id: i,
  //   text: line.text || "",
  //   x: line.bbox.x0,
  //   y: line.bbox.y0,
  //   w: line.bbox.x1 - line.bbox.x0,
  //   h: line.bbox.y1 - line.bbox.y0,
  //   confidence: line.confidence
  // }));

  return { width, height, text: data.text, boxes };
}
