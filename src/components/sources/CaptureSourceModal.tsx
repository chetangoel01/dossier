"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useActionState,
} from "react";
import { createSource } from "@/server/actions/sources";
import type { SourceType } from "@prisma/client";

interface Props {
  dossierId: string;
  open: boolean;
  onClose: () => void;
}

type CaptureTab = "url" | "paste" | "note" | "file";

const TAB_CONFIG: { key: CaptureTab; label: string; sourceType: SourceType }[] = [
  { key: "url", label: "URL", sourceType: "web_link" },
  { key: "paste", label: "Paste Text", sourceType: "pasted_text" },
  { key: "note", label: "Note", sourceType: "manual_note" },
  { key: "file", label: "File", sourceType: "pdf" },
];

const ACCEPTED_FILE_TYPES = ".pdf,.txt,text/plain,application/pdf";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

async function captureAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const dossierId = formData.get("dossierId") as string;
  const type = formData.get("type") as SourceType;
  const title = formData.get("title") as string;
  const url = formData.get("url") as string | null;
  const rawText = formData.get("rawText") as string | null;

  const result = await createSource({
    dossierId,
    type,
    title,
    url: url || null,
    rawText: rawText || null,
  });

  if ("error" in result) return result.error;
  return null;
}

export function CaptureSourceModal({ dossierId, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<CaptureTab>("url");
  const [error, formAction, isPending] = useActionState(captureAction, null);
  const [modalKey, setModalKey] = useState(0);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleTouchedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the previous pending state to detect successful submission
  const prevPendingRef = useRef(isPending);
  useEffect(() => {
    // Transition from pending → not pending with no error = success
    if (prevPendingRef.current && !isPending && error === null && open) {
      onClose();
    }
    prevPendingRef.current = isPending;
  }, [isPending, error, open, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setModalKey((k) => k + 1);
      setActiveTab("url");
      titleTouchedRef.current = false;
      setIsFetchingTitle(false);
      setSelectedFile(null);
      setFileError(null);
      setUploadError(null);
      setIsUploading(false);
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value.trim();

      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Only prefetch if the user hasn't manually typed a title
      if (titleTouchedRef.current) return;

      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }

      if (!parsed.protocol.startsWith("http")) return;

      debounceRef.current = setTimeout(async () => {
        setIsFetchingTitle(true);
        try {
          const res = await fetch("/api/sources/prefetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { title: string | null };
          // Only fill if user still hasn't touched the title
          if (data.title && !titleTouchedRef.current && titleInputRef.current) {
            titleInputRef.current.value = data.title;
          }
        } catch {
          // Silently ignore prefetch failures
        } finally {
          setIsFetchingTitle(false);
        }
      }, 600);
    },
    [],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileError(null);
      setUploadError(null);
      const file = e.target.files?.[0] ?? null;
      if (!file) {
        setSelectedFile(null);
        return;
      }

      // Validate type
      const validTypes = ["application/pdf", "text/plain"];
      if (!validTypes.includes(file.type)) {
        setFileError(
          "Unsupported file type. Only PDF and plain text files are accepted.",
        );
        setSelectedFile(null);
        e.target.value = "";
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setFileError("File is too large. Maximum size is 20 MB.");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }

      setSelectedFile(file);

      // Auto-fill title from filename if user hasn't typed one
      if (!titleTouchedRef.current && titleInputRef.current) {
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
        titleInputRef.current.value = nameWithoutExt;
      }
    },
    [],
  );

  const handleFileUpload = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedFile) return;

      const title = titleInputRef.current?.value.trim();
      if (!title) return;

      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.set("file", selectedFile);
        formData.set("dossierId", dossierId);
        formData.set("title", title);

        const res = await fetch("/api/sources/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as { id?: string; error?: string };

        if (!res.ok || data.error) {
          setUploadError(data.error ?? "Upload failed. Please try again.");
          return;
        }

        // Success — close and let the page revalidate
        onClose();
        // Force a page refresh to show the new source
        window.location.reload();
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [selectedFile, dossierId, onClose],
  );

  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      onClose();
    }
  }

  const currentConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;
  const isFileTab = activeTab === "file";
  const displayError = isFileTab ? uploadError : error;
  const isSubmitting = isFileTab ? isUploading : isPending;

  // Label style shared across all field labels
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--color-ink-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.375rem",
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleDialogClick}
      style={{
        padding: 0,
        border: "var(--border-thin) solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--color-bg-panel)",
        boxShadow: "var(--shadow-float)",
        width: "min(520px, 92vw)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "1.75rem 2rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--color-ink-primary)",
                marginBottom: "0.25rem",
              }}
            >
              Add Source
            </h2>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
                maxWidth: "none",
              }}
            >
              Capture a URL, paste text, write a note, or upload a file
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "0.25rem 0.5rem", marginTop: "-0.25rem" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Source capture type"
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "var(--border-thin) solid var(--color-border)",
            marginBottom: "1.25rem",
          }}
        >
          {TAB_CONFIG.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: "0.5rem 1rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                fontWeight: activeTab === key ? 500 : 400,
                color: activeTab === key
                  ? "var(--color-ink-primary)"
                  : "var(--color-ink-secondary)",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === key
                    ? "var(--border-rule) solid var(--color-accent-ink)"
                    : "var(--border-rule) solid transparent",
                marginBottom: "-1px",
                cursor: "pointer",
                transition:
                  "color var(--duration-fast) ease, border-color var(--duration-fast) ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form — file tab uses its own submit handler; others use server action */}
        <form
          action={isFileTab ? undefined : formAction}
          onSubmit={isFileTab ? handleFileUpload : undefined}
          key={modalKey}
        >
          <input type="hidden" name="dossierId" value={dossierId} />
          {!isFileTab && (
            <input type="hidden" name="type" value={currentConfig.sourceType} />
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Title */}
            <div>
              <label htmlFor="source-title" style={labelStyle}>
                Title{" "}
                <span style={{ color: "var(--color-accent-alert)" }}>*</span>
              </label>
              <input
                ref={titleInputRef}
                id="source-title"
                name="title"
                type="text"
                required
                autoFocus
                placeholder={
                  activeTab === "url"
                    ? "e.g. SEC Filing — Northgate Pharma Q3 2025"
                    : activeTab === "paste"
                      ? "e.g. Reuters article on supply chain disruptions"
                      : activeTab === "file"
                        ? "e.g. Quarterly Earnings Report Q3 2025"
                        : "e.g. Interview notes — Jane Doe, March 2026"
                }
                className="input"
                style={{ fontSize: "0.9375rem" }}
                onChange={(e) => {
                  if (e.target.value.trim()) {
                    titleTouchedRef.current = true;
                  }
                }}
              />
            </div>

            {/* URL field */}
            {activeTab === "url" && (
              <div>
                <label htmlFor="source-url" style={labelStyle}>
                  URL{" "}
                  <span style={{ color: "var(--color-accent-alert)" }}>*</span>
                </label>
                <input
                  id="source-url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://..."
                  className="input"
                  onChange={handleUrlChange}
                />
                {isFetchingTitle && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      color: "var(--color-ink-secondary)",
                      marginTop: "0.25rem",
                    }}
                  >
                    Fetching page title…
                  </p>
                )}
              </div>
            )}

            {/* Pasted text field */}
            {activeTab === "paste" && (
              <div>
                <label htmlFor="source-paste" style={labelStyle}>
                  Content{" "}
                  <span style={{ color: "var(--color-accent-alert)" }}>*</span>
                </label>
                <textarea
                  id="source-paste"
                  name="rawText"
                  required
                  rows={6}
                  placeholder="Paste article text or content here..."
                  className="input"
                  style={{ minHeight: "8rem" }}
                />
              </div>
            )}

            {/* Note field */}
            {activeTab === "note" && (
              <div>
                <label htmlFor="source-note" style={labelStyle}>
                  Note{" "}
                  <span style={{ color: "var(--color-accent-alert)" }}>*</span>
                </label>
                <textarea
                  id="source-note"
                  name="rawText"
                  required
                  rows={6}
                  placeholder="Write your research note..."
                  className="input"
                  style={{ minHeight: "8rem" }}
                />
              </div>
            )}

            {/* File upload field */}
            {activeTab === "file" && (
              <div>
                <label htmlFor="source-file" style={labelStyle}>
                  File{" "}
                  <span style={{ color: "var(--color-accent-alert)" }}>*</span>
                </label>
                <div
                  style={{
                    border: "var(--border-thin) dashed var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1.5rem",
                    textAlign: "center",
                    backgroundColor: "var(--color-bg-canvas)",
                    cursor: "pointer",
                    transition: "border-color var(--duration-fast) ease",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Choose a file to upload"
                >
                  <input
                    ref={fileInputRef}
                    id="source-file"
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  {selectedFile ? (
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.875rem",
                          color: "var(--color-ink-primary)",
                          fontWeight: 500,
                        }}
                      >
                        {selectedFile.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          color: "var(--color-ink-secondary)",
                          marginTop: "0.25rem",
                        }}
                      >
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.875rem",
                          color: "var(--color-ink-secondary)",
                        }}
                      >
                        Click to choose a file
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.6875rem",
                          color: "var(--color-ink-secondary)",
                          marginTop: "0.25rem",
                        }}
                      >
                        PDF or plain text — max 20 MB
                      </p>
                    </div>
                  )}
                </div>

                {fileError && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      color: "var(--color-accent-alert)",
                      marginTop: "0.5rem",
                    }}
                  >
                    {fileError}
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {displayError && (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  color: "var(--color-accent-alert)",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-error-bg)",
                  border: "var(--border-thin) solid var(--color-error-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {displayError}
              </p>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.625rem",
                justifyContent: "flex-end",
                paddingTop: "0.25rem",
                borderTop: "var(--border-thin) solid var(--color-border)",
                marginTop: "0.25rem",
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || (isFileTab && !selectedFile)}
              >
                {isSubmitting
                  ? isFileTab
                    ? "Uploading…"
                    : "Saving…"
                  : "Add Source"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
