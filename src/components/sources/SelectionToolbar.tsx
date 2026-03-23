"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createHighlight } from "@/server/actions/highlights";
import { useRouter } from "next/navigation";

interface SelectionToolbarProps {
  sourceId: string;
  containerRef: React.RefObject<HTMLElement | null>;
  rawText: string;
}

export function SelectionToolbar({
  sourceId,
  containerRef,
  rawText,
}: SelectionToolbarProps) {
  const router = useRouter();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selection, setSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      setPosition(null);
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);

    // Check that the selection is within our container
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setPosition(null);
      setSelection(null);
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText) {
      setPosition(null);
      setSelection(null);
      return;
    }

    // Calculate offsets relative to the raw text
    const preRange = document.createRange();
    preRange.setStart(containerRef.current, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + sel.toString().length;

    // Verify the offsets match the raw text
    if (
      startOffset < 0 ||
      endOffset > rawText.length ||
      rawText.slice(startOffset, endOffset) !== sel.toString()
    ) {
      // Fallback: find the selected text in the raw text near the calculated offset
      const searchStart = Math.max(0, startOffset - 10);
      const searchEnd = Math.min(rawText.length, endOffset + 10);
      const searchRegion = rawText.slice(searchStart, searchEnd);
      const idx = searchRegion.indexOf(selectedText);
      if (idx === -1) {
        setPosition(null);
        setSelection(null);
        return;
      }
      const correctedStart = searchStart + idx;
      const correctedEnd = correctedStart + selectedText.length;

      setSelection({
        text: selectedText,
        startOffset: correctedStart,
        endOffset: correctedEnd,
      });
    } else {
      setSelection({
        text: sel.toString(),
        startOffset,
        endOffset,
      });
    }

    // Position toolbar above the selection
    const rect = range.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY - 44,
      left: rect.left + window.scrollX + rect.width / 2,
    });
  }, [containerRef, rawText]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Close toolbar on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        // Only close if there's no active selection anymore
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setPosition(null);
          setSelection(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!selection || saving) return;
    setSaving(true);

    const result = await createHighlight({
      sourceId,
      quoteText: selection.text,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });

    setSaving(false);

    if ("id" in result) {
      window.getSelection()?.removeAllRanges();
      setPosition(null);
      setSelection(null);
      router.refresh();
    }
  };

  if (!position || !selection) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 50,
        backgroundColor: "var(--color-bg-panel)",
        border: "var(--border-thin) solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-panel)",
        padding: "0.25rem 0.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        whiteSpace: "nowrap",
      }}
    >
      <button
        type="button"
        onClick={handleCreate}
        disabled={saving}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--color-accent-ink)",
          backgroundColor: "transparent",
          border: "none",
          cursor: saving ? "wait" : "pointer",
          padding: "0.25rem 0.375rem",
          borderRadius: "var(--radius-xs)",
          fontWeight: 500,
          letterSpacing: "0.02em",
          opacity: saving ? 0.6 : 1,
          transition: "background-color var(--duration-fast) ease",
        }}
        onMouseEnter={(e) => {
          if (!saving)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--color-highlight-wash)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "transparent";
        }}
      >
        {saving ? "Saving…" : "Highlight"}
      </button>
    </div>
  );
}
