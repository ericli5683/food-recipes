import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const uploadsDir = join(process.cwd(), "public", "uploads");

function sanitizeExtension(mimeType: string): string {
  const extension = mimeType.split("/")[1] ?? "jpg";
  const cleaned = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || "jpg";
}

export async function saveImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  const extension = sanitizeExtension(file.type);
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const fullPath = join(uploadsDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(fullPath, bytes);

  return `/uploads/${filename}`;
}
