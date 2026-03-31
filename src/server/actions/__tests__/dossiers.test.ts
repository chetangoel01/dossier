import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDossier } from "@/lib/test-utils/factories";
import {
  mockAuth,
  mockAuthenticatedUser,
  mockDb,
  mockRedirect,
  mockRevalidatePath,
  resetTestMocks,
} from "@/test/mocks";

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

import {
  archiveDossier,
  createDossier,
  renameDossier,
} from "../dossiers";

describe("dossier actions", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  function buildFormData(values: Record<string, string>) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, value);
    });
    return formData;
  }

  describe("createDossier", () => {
    it("requires authentication", async () => {
      const result = await createDossier(
        null,
        buildFormData({ title: "Briefing" }),
      );

      expect(result).toBe("You must be signed in.");
    });

    it("requires a title", async () => {
      mockAuthenticatedUser();

      const result = await createDossier(null, buildFormData({ title: "   " }));

      expect(result).toBe("Title is required.");
    });

    it("creates a dossier with a unique slug and redirects to it", async () => {
      mockAuthenticatedUser("user-1");
      mockDb.dossier.findFirst
        .mockResolvedValueOnce(buildDossier({ id: "existing", slug: "briefing" }))
        .mockResolvedValueOnce(null);
      mockDb.dossier.create.mockResolvedValue(buildDossier({ id: "dos-123" }));

      await expect(
        createDossier(
          null,
          buildFormData({
            title: "Briefing",
            summary: "  Summary  ",
            research_goal: "  Goal  ",
          }),
        ),
      ).rejects.toThrow("redirect:/dossiers/dos-123");

      expect(mockDb.dossier.create).toHaveBeenCalledWith({
        data: {
          owner_id: "user-1",
          title: "Briefing",
          slug: "briefing-1",
          summary: "Summary",
          research_goal: "Goal",
        },
      });
    });

    it("returns an error when creation fails", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);
      mockDb.dossier.create.mockRejectedValue(new Error("boom"));

      const result = await createDossier(
        null,
        buildFormData({ title: "Briefing" }),
      );

      expect(result).toBe("Failed to create dossier. Please try again.");
    });
  });

  describe("renameDossier", () => {
    it("rejects unauthenticated users", async () => {
      await expect(renameDossier("dos-1", "Renamed")).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("rejects empty titles", async () => {
      mockAuthenticatedUser();

      await expect(renameDossier("dos-1", "   ")).rejects.toThrow(
        "Title is required",
      );
    });

    it("rejects dossiers outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);

      await expect(renameDossier("dos-1", "Renamed")).rejects.toThrow(
        "Not found",
      );
    });

    it("reuses the existing slug when the title is unchanged", async () => {
      mockAuthenticatedUser("user-1");
      mockDb.dossier.findFirst.mockResolvedValue(
        buildDossier({ id: "dos-1", title: "Current Title", slug: "current-title" }),
      );

      await renameDossier("dos-1", " Current Title ");

      expect(mockDb.dossier.update).toHaveBeenCalledWith({
        where: { id: "dos-1" },
        data: { title: "Current Title", slug: "current-title" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers");
    });

    it("generates a new unique slug when the title changes", async () => {
      mockAuthenticatedUser("user-1");
      mockDb.dossier.findFirst
        .mockResolvedValueOnce(
          buildDossier({ id: "dos-1", title: "Current", slug: "current" }),
        )
        .mockResolvedValueOnce(buildDossier({ id: "dos-2", slug: "new-title" }))
        .mockResolvedValueOnce(null);

      await renameDossier("dos-1", "New Title");

      expect(mockDb.dossier.update).toHaveBeenCalledWith({
        where: { id: "dos-1" },
        data: { title: "New Title", slug: "new-title-1" },
      });
    });
  });

  describe("archiveDossier", () => {
    it("rejects unauthenticated users", async () => {
      await expect(archiveDossier("dos-1")).rejects.toThrow("Unauthorized");
    });

    it("rejects dossiers outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);

      await expect(archiveDossier("dos-1")).rejects.toThrow("Not found");
    });

    it("archives the dossier and revalidates the listing", async () => {
      mockAuthenticatedUser("user-1");
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));

      await archiveDossier("dos-1");

      expect(mockDb.dossier.update).toHaveBeenCalledWith({
        where: { id: "dos-1" },
        data: { status: "archived" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers");
    });
  });
});
