import { saveTempFile, cleanupTempDir } from "../services/fileService.js";
import { convertPdfToImages } from "../services/pdfService.js";
import { runOCROnImage } from "../services/ocrService.js";

export async function handleUpload(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const origName = req.file.originalname;
  const ext = origName.split(".").pop().toLowerCase();

  let temp = null;
  try {
    temp = await saveTempFile(req.file.buffer, origName);
    const { dir, filepath } = temp;

    if (ext === "pdf") {
      const images = await convertPdfToImages(filepath, dir);
      const pages = [];
      for (let i = 0; i < images.length; i++) {
        const ocr = await runOCROnImage(images[i]);
        pages.push({ page: i + 1, ...ocr });
      }
      return res.json({ success: true, fileName: origName, pages });
    } else {
      const ocr = await runOCROnImage(filepath);
      return res.json({ success: true, fileName: origName, ...ocr });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (temp) await cleanupTempDir(temp.dir);
  }
}
