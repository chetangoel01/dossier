import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saveUploadedFile, deleteStoredFile } from "@/lib/storage";
import { PDFParse } from "pdf-parse";
import type { SourceType } from "@prisma/client";

const ALLOWED_TYPES: Record<string, { ext: string; sourceType: SourceType }> = {
  "application/pdf": { ext: "pdf", sourceType: "pdf" },
  "text/plain": { ext: "txt", sourceType: "pasted_text" },
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  const dossierId = formData.get("dossierId") as string | null;
  const title = (formData.get("title") as string | null)?.trim();

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (!dossierId) {
    return NextResponse.json(
      { error: "Dossier ID is required." },
      { status: 400 },
    );
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  // Validate file type
  const fileInfo = ALLOWED_TYPES[file.type];
  if (!fileInfo) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Only PDF and plain text files are accepted.",
      },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File is too large. Maximum size is 20 MB." },
      { status: 400 },
    );
  }

  // Verify dossier ownership
  const dossier = await db.dossier.findFirst({
    where: { id: dossierId, owner_id: session.user.id },
    select: { id: true },
  });
  if (!dossier) {
    return NextResponse.json({ error: "Dossier not found." }, { status: 404 });
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Extract text content
  let rawText: string | null = null;
  try {
    if (file.type === "text/plain") {
      rawText = new TextDecoder().decode(buffer);
    } else if (file.type === "application/pdf") {
      const pdf = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await pdf.getText();
      rawText = textResult.text || null;
      await pdf.destroy();
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to extract text from the uploaded file." },
      { status: 422 },
    );
  }

  // Save file to storage
  let stored;
  try {
    stored = await saveUploadedFile(buffer, file.name, file.type);
  } catch {
    return NextResponse.json(
      { error: "Failed to save file. Please try again." },
      { status: 500 },
    );
  }

  // Create source record
  try {
    const source = await db.source.create({
      data: {
        dossier_id: dossierId,
        type: fileInfo.sourceType,
        title,
        raw_text: rawText,
        file_path: stored.filePath,
        file_name: stored.fileName,
        file_size: stored.fileSize,
        source_status: "unreviewed",
      },
    });

    return NextResponse.json({ id: source.id });
  } catch {
    // Clean up the saved file if DB insert fails
    await deleteStoredFile(stored.filePath);
    return NextResponse.json(
      { error: "Failed to create source. Please try again." },
      { status: 500 },
    );
  }
}
