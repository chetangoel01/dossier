import { beforeEach, describe, expect, it, vi } from "vitest";
import {
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

import {
  createSource,
  deleteSource,
  updateSource,
  updateSourceStatus,
} from "../sources";

describe("source actions", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe("createSource", () => {
    it("requires authentication", async () => {
      const result = await createSource({
        dossierId: "dos-1",
        type: "web_link",
        title: "Source",
        url: "https://example.com",
      });

      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("validates input and type-specific requirements", async () => {
      mockAuthenticatedUser();

      await expect(
        createSource({
          dossierId: "",
          type: "web_link",
          title: "Source",
          url: "https://example.com",
        }),
      ).resolves.toEqual({ error: "Dossier ID is required." });

      await expect(
        createSource({
          dossierId: "dos-1",
          type: "web_link",
          title: "   ",
          url: "https://example.com",
        }),
      ).resolves.toEqual({ error: "Title is required." });

      await expect(
        createSource({
          dossierId: "dos-1",
          type: "bad" as never,
          title: "Source",
        }),
      ).resolves.toEqual({
        error: "Invalid source type. Must be one of: web_link, pdf, pasted_text, manual_note, internal_memo.",
      });

      await expect(
        createSource({
          dossierId: "dos-1",
          type: "web_link",
          title: "Source",
        }),
      ).resolves.toEqual({ error: "URL is required for web link sources." });

      await expect(
        createSource({
          dossierId: "dos-1",
          type: "manual_note",
          title: "Source",
        }),
      ).resolves.toEqual({ error: "Note content is required for manual note sources." });

      await expect(
        createSource({
          dossierId: "dos-1",
          type: "web_link",
          title: "Source",
          url: "https://example.com",
          credibilityRating: 101,
        }),
      ).resolves.toEqual({
        error: "Credibility rating must be an integer between 0 and 100.",
      });

      await expect(
        createSource({
          dossierId: "dos-1",
          type: "web_link",
          title: "Source",
          url: "https://example.com",
          publishedAt: "not-a-date",
        }),
      ).resolves.toEqual({ error: "Published date is invalid." });
    });

    it("rejects dossiers outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);

      const result = await createSource({
        dossierId: "dos-1",
        type: "web_link",
        title: "Source",
        url: "https://example.com",
      });

      expect(result).toEqual({ error: "Dossier not found." });
    });

    it("creates sources and revalidates the listing", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue({ id: "dos-1" });
      mockDb.source.create.mockResolvedValue(buildSource({ id: "source-1" }));

      const result = await createSource({
        dossierId: "dos-1",
        type: "web_link",
        title: "  Source  ",
        url: " https://example.com ",
        author: "  Author  ",
        publisher: "  Publisher  ",
        publishedAt: "2024-03-01T00:00:00.000Z",
        rawText: "Raw text",
        summary: "  Summary  ",
        credibilityRating: 70,
        sourceStatus: "reviewing",
      });

      expect(result).toEqual({ id: "source-1" });
      expect(mockDb.source.create).toHaveBeenCalledWith({
        data: {
          dossier_id: "dos-1",
          type: "web_link",
          title: "Source",
          url: "https://example.com",
          author: "Author",
          publisher: "Publisher",
          published_at: new Date("2024-03-01T00:00:00.000Z"),
          raw_text: "Raw text",
          summary: "Summary",
          credibility_rating: 70,
          source_status: "reviewing",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/sources");
    });
  });

  describe("updateSource", () => {
    it("rejects sources outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(null);

      const result = await updateSource("source-1", { title: "Updated" });

      expect(result).toEqual({ error: "Source not found." });
    });

    it("validates update input", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({ id: "source-1", type: "web_link", url: "https://example.com" }),
      );

      await expect(
        updateSource("source-1", { type: "bad" as never }),
      ).resolves.toEqual({
        error: "Invalid source type. Must be one of: web_link, pdf, pasted_text, manual_note, internal_memo.",
      });
      await expect(
        updateSource("source-1", { sourceStatus: "bad" as never }),
      ).resolves.toEqual({
        error: "Invalid source status. Must be one of: unreviewed, reviewing, reviewed, discarded.",
      });
      await expect(updateSource("source-1", { title: "   " })).resolves.toEqual({
        error: "Title is required.",
      });
      await expect(
        updateSource("source-1", { credibilityRating: 1.5 }),
      ).resolves.toEqual({
        error: "Credibility rating must be an integer between 0 and 100.",
      });
      await expect(
        updateSource("source-1", { publishedAt: "not-a-date" }),
      ).resolves.toEqual({ error: "Published date is invalid." });
    });

    it("enforces type-specific requirements against the merged source state", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({ id: "source-1", type: "web_link", url: "https://example.com" }),
      );

      const result = await updateSource("source-1", { url: "   " });

      expect(result).toEqual({ error: "URL is required for web link sources." });
    });

    it("updates sources and revalidates the listing", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({ id: "source-1", dossier_id: "dos-1", type: "web_link" }),
      );

      const result = await updateSource("source-1", {
        title: "  Updated  ",
        url: " https://example.com ",
        author: "  Author  ",
        publisher: "  Publisher  ",
        publishedAt: "2024-03-01T00:00:00.000Z",
        rawText: "Updated text",
        summary: "  Summary  ",
        credibilityRating: 75,
        sourceStatus: "reviewed",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.source.update).toHaveBeenCalledWith({
        where: { id: "source-1" },
        data: {
          title: "Updated",
          url: "https://example.com",
          author: "Author",
          publisher: "Publisher",
          published_at: new Date("2024-03-01T00:00:00.000Z"),
          raw_text: "Updated text",
          summary: "Summary",
          credibility_rating: 75,
          source_status: "reviewed",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/sources");
    });
  });

  describe("updateSourceStatus", () => {
    it("validates the requested status", async () => {
      mockAuthenticatedUser();

      const result = await updateSourceStatus("source-1", "bad" as never);

      expect(result).toEqual({
        error: "Invalid source status. Must be one of: unreviewed, reviewing, reviewed, discarded.",
      });
    });

    it("updates the status and revalidates the listing", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({ id: "source-1", dossier_id: "dos-1" }),
      );

      const result = await updateSourceStatus("source-1", "discarded");

      expect(result).toEqual({ success: true });
      expect(mockDb.source.update).toHaveBeenCalledWith({
        where: { id: "source-1" },
        data: { source_status: "discarded" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/sources");
    });
  });

  describe("deleteSource", () => {
    it("deletes the source and revalidates the listing", async () => {
      mockAuthenticatedUser();
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({ id: "source-1", dossier_id: "dos-1" }),
      );

      const result = await deleteSource("source-1");

      expect(result).toEqual({ success: true });
      expect(mockDb.source.delete).toHaveBeenCalledWith({
        where: { id: "source-1" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/sources");
    });
  });
});
