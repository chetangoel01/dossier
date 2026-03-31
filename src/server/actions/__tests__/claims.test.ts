import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildClaim,
  buildDossier,
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

import { createClaim, deleteClaim, updateClaim } from "../claims";

describe("claim actions", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe("createClaim", () => {
    it("requires authentication", async () => {
      const result = await createClaim({
        dossierId: "dos-1",
        statement: "Claim",
        highlightIds: ["hl-1"],
      });

      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("validates required fields", async () => {
      mockAuthenticatedUser();

      await expect(
        createClaim({
          dossierId: "",
          statement: "Claim",
          highlightIds: ["hl-1"],
        }),
      ).resolves.toEqual({ error: "Dossier ID is required." });

      await expect(
        createClaim({
          dossierId: "dos-1",
          statement: "   ",
          highlightIds: ["hl-1"],
        }),
      ).resolves.toEqual({ error: "Statement is required." });

      await expect(
        createClaim({
          dossierId: "dos-1",
          statement: "Claim",
          status: "bad" as never,
          highlightIds: ["hl-1"],
        }),
      ).resolves.toEqual({
        error: "Invalid status. Must be one of: open, supported, contested, deprecated.",
      });

      await expect(
        createClaim({
          dossierId: "dos-1",
          statement: "Claim",
          confidence: 101,
          highlightIds: ["hl-1"],
        }),
      ).resolves.toEqual({ error: "Confidence must be between 0 and 100." });

      await expect(
        createClaim({
          dossierId: "dos-1",
          statement: "Claim",
          highlightIds: [],
        }),
      ).resolves.toEqual({ error: "At least one highlight is required." });
    });

    it("rejects dossiers outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);

      const result = await createClaim({
        dossierId: "dos-1",
        statement: "Claim",
        highlightIds: ["hl-1"],
      });

      expect(result).toEqual({ error: "Dossier not found." });
    });

    it("rejects highlights outside the dossier", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.highlight.findMany.mockResolvedValue([{ id: "hl-1" }]);

      const result = await createClaim({
        dossierId: "dos-1",
        statement: "Claim",
        highlightIds: ["hl-1", "hl-2"],
      });

      expect(result).toEqual({
        error: "One or more highlights not found in this dossier.",
      });
    });

    it("creates a claim and revalidates the dossier views", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.highlight.findMany.mockResolvedValue([{ id: "hl-1" }, { id: "hl-2" }]);
      mockDb.claim.create.mockResolvedValue(buildClaim({ id: "claim-1" }));

      const result = await createClaim({
        dossierId: "dos-1",
        statement: "  Claim statement  ",
        status: "supported",
        confidence: 80,
        notes: "  Notes  ",
        highlightIds: ["hl-1", "hl-2"],
      });

      expect(result).toEqual({ id: "claim-1" });
      expect(mockDb.claim.create).toHaveBeenCalledWith({
        data: {
          dossier_id: "dos-1",
          statement: "Claim statement",
          status: "supported",
          confidence: 80,
          notes: "Notes",
          highlights: {
            create: [{ highlight_id: "hl-1" }, { highlight_id: "hl-2" }],
          },
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/claims");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/sources");
    });
  });

  describe("updateClaim", () => {
    it("requires authentication", async () => {
      const result = await updateClaim({ id: "claim-1", statement: "Updated" });

      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("validates updates", async () => {
      mockAuthenticatedUser();

      await expect(updateClaim({ id: "", statement: "Updated" })).resolves.toEqual({
        error: "Claim ID is required.",
      });
      await expect(updateClaim({ id: "claim-1", statement: "   " })).resolves.toEqual({
        error: "Statement cannot be empty.",
      });
      await expect(
        updateClaim({ id: "claim-1", status: "bad" as never }),
      ).resolves.toEqual({
        error: "Invalid status. Must be one of: open, supported, contested, deprecated.",
      });
      await expect(
        updateClaim({ id: "claim-1", confidence: -1 }),
      ).resolves.toEqual({ error: "Confidence must be between 0 and 100." });
    });

    it("rejects claims outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.claim.findFirst.mockResolvedValue(null);

      const result = await updateClaim({ id: "claim-1", statement: "Updated" });

      expect(result).toEqual({ error: "Claim not found." });
    });

    it("updates claims and revalidates the dossier views", async () => {
      mockAuthenticatedUser();
      mockDb.claim.findFirst.mockResolvedValue({ id: "claim-1", dossier_id: "dos-1" });

      const result = await updateClaim({
        id: "claim-1",
        statement: "  Updated statement  ",
        status: "contested",
        confidence: 40,
        notes: "  Notes  ",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.claim.update).toHaveBeenCalledWith({
        where: { id: "claim-1" },
        data: {
          statement: "Updated statement",
          status: "contested",
          confidence: 40,
          notes: "Notes",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/claims");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/sources");
    });
  });

  describe("deleteClaim", () => {
    it("requires authentication", async () => {
      const result = await deleteClaim("claim-1");

      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("rejects claims outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.claim.findFirst.mockResolvedValue(null);

      const result = await deleteClaim("claim-1");

      expect(result).toEqual({ error: "Claim not found." });
    });

    it("deletes claims and revalidates the dossier views", async () => {
      mockAuthenticatedUser();
      mockDb.claim.findFirst.mockResolvedValue({ id: "claim-1", dossier_id: "dos-1" });

      const result = await deleteClaim("claim-1");

      expect(result).toEqual({ success: true });
      expect(mockDb.claim.delete).toHaveBeenCalledWith({
        where: { id: "claim-1" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/claims");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1/sources");
    });
  });
});
