import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAuth,
  mockAuthenticatedUser,
  mockDb,
  resetTestMocks,
} from "@/test/mocks";

const {
  mockSaveUploadedFile,
  mockDeleteStoredFile,
  mockPdfGetText,
  mockPdfDestroy,
  mockPDFParse,
} = vi.hoisted(() => {
  const mockPdfGetText = vi.fn();
  const mockPdfDestroy = vi.fn();

  return {
    mockSaveUploadedFile: vi.fn(),
    mockDeleteStoredFile: vi.fn(),
    mockPdfGetText,
    mockPdfDestroy,
    mockPDFParse: vi.fn(() => ({
      getText: mockPdfGetText,
      destroy: mockPdfDestroy,
    })),
  };
});

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/storage", () => ({
  saveUploadedFile: mockSaveUploadedFile,
  deleteStoredFile: mockDeleteStoredFile,
}));
vi.mock("pdf-parse", () => ({ PDFParse: mockPDFParse }));

import { POST } from "./route";

describe("POST /api/sources/upload", () => {
  beforeEach(() => {
    resetTestMocks();
    mockSaveUploadedFile.mockReset();
    mockDeleteStoredFile.mockReset();
    mockPdfGetText.mockReset();
    mockPdfDestroy.mockReset();
    mockPDFParse.mockClear();
    mockSaveUploadedFile.mockResolvedValue({
      filePath: "sources/file.txt",
      fileName: "note.txt",
      fileSize: 12,
    });
    mockPdfGetText.mockResolvedValue({ text: "PDF text" });
  });

  function buildRequest(formData: FormData) {
    return {
      formData: vi.fn().mockResolvedValue(formData),
    } as never;
  }

  function createUploadFile(contents: string, name: string, type: string) {
    const file = new File([contents], name, { type });
    Object.defineProperty(file, "arrayBuffer", {
      value: vi.fn().mockResolvedValue(new TextEncoder().encode(contents).buffer),
    });
    return file;
  }

  function buildFormData(file?: File, extras: Record<string, string> = {}) {
    const values = new Map<string, string | File>();
    if (file) {
      values.set("file", file);
    }
    Object.entries(extras).forEach(([key, value]) => {
      values.set(key, value);
    });
    return {
      get(key: string) {
        return values.get(key) ?? null;
      },
    } as FormData;
  }

  it("rejects unauthenticated requests", async () => {
    const response = await POST(buildRequest(new FormData()));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects invalid form data", async () => {
    mockAuthenticatedUser();

    const response = await POST({
      formData: vi.fn().mockRejectedValue(new Error("bad form")),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid form data.",
    });
  });

  it("requires a file, dossier id, and title", async () => {
    mockAuthenticatedUser();

    const missingFile = await POST(
      buildRequest(buildFormData(undefined, { dossierId: "dos-1", title: "Source" })),
    );
    await expect(missingFile.json()).resolves.toEqual({
      error: "File is required.",
    });

    const missingDossier = await POST(
      buildRequest(
        buildFormData(new File(["hello"], "note.txt", { type: "text/plain" }), {
          title: "Source",
        }),
      ),
    );
    await expect(missingDossier.json()).resolves.toEqual({
      error: "Dossier ID is required.",
    });

    const missingTitle = await POST(
      buildRequest(
        buildFormData(new File(["hello"], "note.txt", { type: "text/plain" }), {
          dossierId: "dos-1",
        }),
      ),
    );
    await expect(missingTitle.json()).resolves.toEqual({
      error: "Title is required.",
    });
  });

  it("rejects unsupported file types", async () => {
    mockAuthenticatedUser();

    const response = await POST(
      buildRequest(
        buildFormData(new File(["{}"], "data.json", { type: "application/json" }), {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported file type. Only PDF and plain text files are accepted.",
    });
  });

  it("rejects oversized files", async () => {
    mockAuthenticatedUser();
    const file = new File(["x"], "note.txt", { type: "text/plain" });
    Object.defineProperty(file, "size", { value: 20 * 1024 * 1024 + 1 });

    const response = await POST(
      buildRequest(
        buildFormData(file, {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "File is too large. Maximum size is 20 MB.",
    });
  });

  it("rejects dossiers outside the current account", async () => {
    mockAuthenticatedUser();
    mockDb.dossier.findFirst.mockResolvedValue(null);

    const response = await POST(
      buildRequest(
        buildFormData(new File(["hello"], "note.txt", { type: "text/plain" }), {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Dossier not found." });
  });

  it("creates plain-text sources after saving the uploaded file", async () => {
    mockAuthenticatedUser();
    mockDb.dossier.findFirst.mockResolvedValue({ id: "dos-1" });
    mockDb.source.create.mockResolvedValue({ id: "source-1" });

    const response = await POST(
      buildRequest(
        buildFormData(createUploadFile("hello world", "note.txt", "text/plain"), {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: "source-1" });
    expect(mockSaveUploadedFile).toHaveBeenCalledTimes(1);
    expect(mockDb.source.create).toHaveBeenCalledWith({
      data: {
        dossier_id: "dos-1",
        type: "pasted_text",
        title: "Source",
        raw_text: "hello world",
        file_path: "sources/file.txt",
        file_name: "note.txt",
        file_size: 12,
        source_status: "unreviewed",
      },
    });
  });

  it("extracts PDF text before saving and creating the source", async () => {
    mockAuthenticatedUser();
    mockDb.dossier.findFirst.mockResolvedValue({ id: "dos-1" });
    mockDb.source.create.mockResolvedValue({ id: "source-1" });

    const response = await POST(
      buildRequest(
        buildFormData(createUploadFile("%PDF", "file.pdf", "application/pdf"), {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(mockPDFParse).toHaveBeenCalledTimes(1);
    expect(mockPdfDestroy).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ id: "source-1" });
  });

  it("returns 422 when text extraction fails", async () => {
    mockAuthenticatedUser();
    mockDb.dossier.findFirst.mockResolvedValue({ id: "dos-1" });
    mockPdfGetText.mockRejectedValue(new Error("parse failed"));

    const response = await POST(
      buildRequest(
        buildFormData(createUploadFile("%PDF", "file.pdf", "application/pdf"), {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to extract text from the uploaded file.",
    });
    expect(mockSaveUploadedFile).not.toHaveBeenCalled();
  });

  it("returns 500 when saving the file fails", async () => {
    mockAuthenticatedUser();
    mockDb.dossier.findFirst.mockResolvedValue({ id: "dos-1" });
    mockSaveUploadedFile.mockRejectedValue(new Error("save failed"));

    const response = await POST(
      buildRequest(
        buildFormData(createUploadFile("hello", "note.txt", "text/plain"), {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to save file. Please try again.",
    });
  });

  it("cleans up stored files when database insertion fails", async () => {
    mockAuthenticatedUser();
    mockDb.dossier.findFirst.mockResolvedValue({ id: "dos-1" });
    mockDb.source.create.mockRejectedValue(new Error("db failed"));

    const response = await POST(
      buildRequest(
        buildFormData(createUploadFile("hello", "note.txt", "text/plain"), {
          dossierId: "dos-1",
          title: "Source",
        }),
      ),
    );

    expect(response.status).toBe(500);
    expect(mockDeleteStoredFile).toHaveBeenCalledWith("sources/file.txt");
    await expect(response.json()).resolves.toEqual({
      error: "Failed to create source. Please try again.",
    });
  });
});
