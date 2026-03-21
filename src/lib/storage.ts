import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Local file storage for uploaded source files.
 * Stores files under `uploads/sources/<uuid>.<ext>`.
 * Designed for local dev; the path format is S3-compatible for later migration.
 */

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "sources");

/** Ensure the upload directory exists. */
async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/** Map MIME type to file extension. */
function extFromMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "text/plain":
      return "txt";
    default:
      return "bin";
  }
}

export interface StoredFile {
  /** Relative path suitable for DB storage (S3-compatible key). */
  filePath: string;
  /** Original file name from the upload. */
  fileName: string;
  /** File size in bytes. */
  fileSize: number;
}

/** Save uploaded file bytes and return the storage metadata. */
export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFile> {
  await ensureUploadDir();

  const ext = extFromMime(mimeType);
  const key = `${randomUUID()}.${ext}`;
  const fullPath = path.join(UPLOAD_DIR, key);

  await writeFile(fullPath, buffer);

  return {
    filePath: `sources/${key}`,
    fileName: originalName,
    fileSize: buffer.length,
  };
}

/** Delete a stored file by its relative path. Best-effort, does not throw. */
export async function deleteStoredFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), "uploads", filePath);
    await unlink(fullPath);
  } catch {
    // File may already be gone — ignore
  }
}
