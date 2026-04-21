import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildBrief, buildDossier } from "@/lib/test-utils/factories";
import {
  mockAuth,
  mockAuthenticatedUser,
  mockDb,
  resetTestMocks,
} from "@/test/mocks";

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: mockDb }));

import { saveBrief } from "../briefs";

describe("brief actions", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe("saveBrief", () => {
    it("requires authentication", async () => {
      const result = await saveBrief({
        dossierId: "dos-1",
        title: "Memo",
        bodyMarkdown: "",
      });
      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("validates required fields", async () => {
      mockAuthenticatedUser();

      await expect(
        saveBrief({ dossierId: "", title: "Memo", bodyMarkdown: "" }),
      ).resolves.toEqual({ error: "Dossier ID is required." });

      await expect(
        saveBrief({ dossierId: "dos-1", title: "   ", bodyMarkdown: "" }),
      ).resolves.toEqual({ error: "Brief title is required." });

      await expect(
        saveBrief({
          dossierId: "dos-1",
          title: "x".repeat(201),
          bodyMarkdown: "",
        }),
      ).resolves.toEqual({
        error: "Brief title must be under 200 characters.",
      });

      await expect(
        saveBrief({
          dossierId: "dos-1",
          title: "Memo",
          bodyMarkdown: "x".repeat(200_001),
        }),
      ).resolves.toEqual({ error: "Brief is too long to save." });
    });

    it("rejects dossiers outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);

      const result = await saveBrief({
        dossierId: "dos-1",
        title: "Memo",
        bodyMarkdown: "Draft",
      });
      expect(result).toEqual({ error: "Dossier not found." });
    });

    it("upserts the brief and returns the updated timestamp", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      const updatedAt = new Date("2026-04-21T12:34:56Z");
      mockDb.brief.upsert.mockResolvedValue(
        buildBrief({ dossier_id: "dos-1", updated_at: updatedAt }),
      );

      const result = await saveBrief({
        dossierId: "dos-1",
        title: "  Q2 Memo  ",
        bodyMarkdown: "## Summary\n\nLorem.",
      });

      expect(result).toEqual({
        success: true,
        updatedAt: updatedAt.toISOString(),
      });

      const call = mockDb.brief.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ dossier_id: "dos-1" });
      expect(call.update).toEqual({
        title: "Q2 Memo",
        body_markdown: "## Summary\n\nLorem.",
      });
      expect(call.create).toEqual({
        dossier_id: "dos-1",
        title: "Q2 Memo",
        body_markdown: "## Summary\n\nLorem.",
      });
    });

    it("returns a generic error when the database write fails", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.brief.upsert.mockRejectedValue(new Error("boom"));

      const result = await saveBrief({
        dossierId: "dos-1",
        title: "Memo",
        bodyMarkdown: "Draft",
      });

      expect(result).toEqual({ error: "Failed to save brief. Please try again." });
    });
  });
});
