import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildHighlight,
  buildSource,
} from "@/lib/test-utils/factories";
import {
  mockAuth,
  mockAuthenticatedUser,
  mockDb,
  mockRevalidatePath,
  resetTestMocks,
} from "@/test/mocks";

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import { createHighlight, deleteHighlight } from "../highlights";

describe("highlight actions", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe("createHighlight", () => {
    it("requires authentication", async () => {
      const result = await createHighlight({
        sourceId: "source-1",
        quoteText: "Evidence",
        startOffset: 0,
        endOffset: 8,
      });

      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("validates required fields and offsets", async () => {
      mockAuthenticatedUser();

      await expect(
        createHighlight({
          sourceId: "",
          quoteText: "Evidence",
          startOffset: 0,
          endOffset: 8,
        }),
      ).resolves.toEqual({ error: "Source ID is required." });

      await expect(
        createHighlight({
          sourceId: "source-1",
          quoteText: "   ",
          startOffset: 0,
          endOffset: 8,
        }),
      ).resolves.toEqual({ error: "Quote text is required." });

      await expect(
        createHighlight({
          sourceId: "source-1",
          quoteText: "Evidence",
          startOffset: -1,
          endOffset: 8,
        }),
      ).resolves.toEqual({ error: "Invalid start offset." });

      await expect(
        createHighlight({
          sourceId: "source-1",
          quoteText: "Evidence",
          startOffset: 5,
          endOffset: 5,
        }),
      ).resolves.toEqual({ error: "Invalid offset range." });
    });

    it("rejects invalid labels", async () => {
      mockAuthenticatedUser();

      const result = await createHighlight({
        sourceId: "source-1",
        quoteText: "Evidence",
        startOffset: 0,
        endOffset: 8,
        label: "bad-label" as never,
      });

      expect(result).toEqual({
        error: "Invalid label. Must be one of: evidence, question, counterpoint, stat, quote.",
      });
    });

    it("rejects sources outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(null);

      const result = await createHighlight({
        sourceId: "source-1",
        quoteText: "Evidence",
        startOffset: 0,
        endOffset: 8,
      });

      expect(result).toEqual({ error: "Source not found." });
    });

    it("creates a highlight and revalidates the reader page", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({ id: "source-1", dossier_id: "dos-1" }),
      );
      mockDb.highlight.create.mockResolvedValue(buildHighlight({ id: "hl-1" }));

      const result = await createHighlight({
        sourceId: "source-1",
        quoteText: "Evidence",
        startOffset: 2,
        endOffset: 10,
        annotation: "  Annotated  ",
      });

      expect(result).toEqual({ id: "hl-1" });
      expect(mockDb.highlight.create).toHaveBeenCalledWith({
        data: {
          source_id: "source-1",
          quote_text: "Evidence",
          start_offset: 2,
          end_offset: 10,
          label: "evidence",
          annotation: "Annotated",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dossiers/dos-1/sources/source-1",
      );
    });
  });

  describe("deleteHighlight", () => {
    it("requires authentication", async () => {
      const result = await deleteHighlight("hl-1");

      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("rejects highlights outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.highlight.findFirst.mockResolvedValue(null);

      const result = await deleteHighlight("hl-1");

      expect(result).toEqual({ error: "Highlight not found." });
    });

    it("deletes the highlight and revalidates the reader page", async () => {
      mockAuthenticatedUser();
      mockDb.highlight.findFirst.mockResolvedValue({
        id: "hl-1",
        source: { id: "source-1", dossier_id: "dos-1" },
      });

      const result = await deleteHighlight("hl-1");

      expect(result).toEqual({ success: true });
      expect(mockDb.highlight.delete).toHaveBeenCalledWith({
        where: { id: "hl-1" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dossiers/dos-1/sources/source-1",
      );
    });
  });
});
