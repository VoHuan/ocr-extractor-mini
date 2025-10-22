import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { TMP_DIR } from "../config/appConfig.js";

export async function saveTempFile(buffer, filename) {
  const id = uuidv4();
  const dir = path.join(TMP_DIR, id);
  await fs.ensureDir(dir);
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, buffer);
  return { id, dir, filepath };
}

export async function cleanupTempDir(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    console.warn("Cleanup failed:", e.message);
  }
}
