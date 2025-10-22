import path from "path";
import { promises as fs } from "fs";
import pdfPoppler from "pdf-poppler";
import { v4 as uuidv4 } from "uuid";

export async function convertPdfToImages(pdfPath, outputDir) {
  const id = uuidv4();
  const outputSubdir = path.join(outputDir, id);
  await fs.mkdir(outputSubdir, { recursive: true });

  const outputPrefix = path.join(outputSubdir, "page");

  const opts = {
    format: "png",
    out_dir: outputSubdir,
    out_prefix: "page",
    page: null, // convert all pages
    scale: 1024, // increase resolution
  };

  await pdfPoppler.convert(pdfPath, opts);

  // get the list of created images
  const files = await fs.readdir(outputSubdir);
  const images = files
    .filter((f) => f.endsWith(".png"))
    .map((f) => path.join(outputSubdir, f));

  return images;
}
