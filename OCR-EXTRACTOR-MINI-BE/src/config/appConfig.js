import path from "path";
import fs from "fs-extra";

export const PORT = process.env.PORT || 5000;
export const TMP_DIR = path.resolve("tmp_uploads");

// Temporary directory for uploads
fs.ensureDirSync(TMP_DIR);
