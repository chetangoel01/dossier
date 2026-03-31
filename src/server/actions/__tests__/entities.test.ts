import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildClaim,
  buildDossier,
  buildEntity,
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
  createEntity,
  deleteEntity,
  linkEntity,
  updateEntity,
} from "../entities";

describe("entity actions", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe("createEntity", () => {
    it("requires authentication", async () => {
      const result = await createEntity({
        dossierId: "dos-1",
        name: "Entity",
        type: "person",
      });

      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("validates required fields", async () => {
      mockAuthenticatedUser();

      await expect(
        createEntity({ dossierId: "", name: "Entity", type: "person" }),
      ).resolves.toEqual({ error: "Dossier ID is required." });
      await expect(
        createEntity({ dossierId: "dos-1", name: "   ", type: "person" }),
      ).resolves.toEqual({ error: "Entity name is required." });
      await expect(
        createEntity({
          dossierId: "dos-1",
          name: "Entity",
          type: "invalid" as never,
        }),
      ).resolves.toEqual({
        error: "Invalid entity type. Must be one of: person, company, product, location, institution, topic.",
      });
      await expect(
        createEntity({
          dossierId: "dos-1",
          name: "Entity",
          type: "person",
          importance: 101,
        }),
      ).resolves.toEqual({ error: "Importance must be between 0 and 100." });
    });

    it("rejects dossiers outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);

      const result = await createEntity({
        dossierId: "dos-1",
        name: "Entity",
        type: "person",
      });

      expect(result).toEqual({ error: "Dossier not found." });
    });

    it("creates an entity and revalidates the dossier layout", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.entity.create.mockResolvedValue({ id: "entity-1" });

      const result = await createEntity({
        dossierId: "dos-1",
        name: "  Entity  ",
        type: "company",
        description: "  Description  ",
        aliases: ["", "Alias", "Other"],
        importance: 80,
      });

      expect(result).toEqual({ id: "entity-1" });
      expect(mockDb.entity.create).toHaveBeenCalledWith({
        data: {
          dossier_id: "dos-1",
          name: "Entity",
          type: "company",
          description: "Description",
          aliases: ["Alias", "Other"],
          importance: 80,
        },
        select: { id: true },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1", "layout");
    });
  });

  describe("updateEntity", () => {
    it("validates updates", async () => {
      mockAuthenticatedUser();

      await expect(updateEntity({ id: "", name: "Entity" })).resolves.toEqual({
        error: "Entity ID is required.",
      });
      await expect(updateEntity({ id: "entity-1", name: "   " })).resolves.toEqual({
        error: "Entity name cannot be empty.",
      });
      await expect(
        updateEntity({ id: "entity-1", type: "bad" as never }),
      ).resolves.toEqual({
        error: "Invalid entity type. Must be one of: person, company, product, location, institution, topic.",
      });
      await expect(
        updateEntity({ id: "entity-1", importance: -1 }),
      ).resolves.toEqual({ error: "Importance must be between 0 and 100." });
    });

    it("rejects entities outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue(null);

      const result = await updateEntity({ id: "entity-1", name: "Entity" });

      expect(result).toEqual({ error: "Entity not found." });
    });

    it("updates an entity and revalidates the dossier layout", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue({
        id: "entity-1",
        dossier_id: "dos-1",
      });

      const result = await updateEntity({
        id: "entity-1",
        name: "  Entity  ",
        type: "topic",
        description: "  Description  ",
        aliases: ["", "Alias"],
        importance: 50,
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.entity.update).toHaveBeenCalledWith({
        where: { id: "entity-1" },
        data: {
          name: "Entity",
          type: "topic",
          description: "Description",
          aliases: ["Alias"],
          importance: 50,
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1", "layout");
    });
  });

  describe("deleteEntity", () => {
    it("rejects entities outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue(null);

      const result = await deleteEntity("entity-1");

      expect(result).toEqual({ error: "Entity not found." });
    });

    it("deletes an entity and revalidates the dossier layout", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue({
        id: "entity-1",
        dossier_id: "dos-1",
      });

      const result = await deleteEntity("entity-1");

      expect(result).toEqual({ success: true });
      expect(mockDb.entity.delete).toHaveBeenCalledWith({
        where: { id: "entity-1" },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1", "layout");
    });
  });

  describe("linkEntity", () => {
    it("requires exactly one target", async () => {
      mockAuthenticatedUser();

      const result = await linkEntity({
        entityId: "entity-1",
        sourceId: "source-1",
        claimId: "claim-1",
      });

      expect(result).toEqual({ error: "Linking requires exactly one target." });
    });

    it("rejects entities outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue(null);

      const result = await linkEntity({ entityId: "entity-1", claimId: "claim-1" });

      expect(result).toEqual({ error: "Entity not found." });
    });

    it("links a claim and revalidates the dossier layout", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue(
        buildEntity({ id: "entity-1", dossier_id: "dos-1" }),
      );
      mockDb.claim.findFirst.mockResolvedValue(
        buildClaim({ id: "claim-1", dossier_id: "dos-1" }),
      );

      const result = await linkEntity({ entityId: "entity-1", claimId: "claim-1" });

      expect(result).toEqual({ success: true });
      expect(mockDb.claimEntity.upsert).toHaveBeenCalledWith({
        where: {
          claim_id_entity_id: {
            claim_id: "claim-1",
            entity_id: "entity-1",
          },
        },
        update: {},
        create: {
          claim_id: "claim-1",
          entity_id: "entity-1",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1", "layout");
    });

    it("creates a mention from a source summary when linking a source", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue(
        buildEntity({ id: "entity-1", dossier_id: "dos-1" }),
      );
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({
          id: "source-1",
          dossier_id: "dos-1",
          summary: "  Summary text  ",
          raw_text: "Raw text fallback",
          title: "Source title",
        }),
      );
      mockDb.mention.findFirst.mockResolvedValue(null);

      const result = await linkEntity({ entityId: "entity-1", sourceId: "source-1" });

      expect(result).toEqual({ success: true });
      expect(mockDb.mention.create).toHaveBeenCalledWith({
        data: {
          entity_id: "entity-1",
          source_id: "source-1",
          context_snippet: "Summary text",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1", "layout");
    });

    it("skips mention creation when the source link already exists", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue(
        buildEntity({ id: "entity-1", dossier_id: "dos-1" }),
      );
      mockDb.source.findFirst.mockResolvedValue(
        buildSource({ id: "source-1", dossier_id: "dos-1", title: "Source title" }),
      );
      mockDb.mention.findFirst.mockResolvedValue({ id: "mention-1" });

      const result = await linkEntity({
        entityId: "entity-1",
        sourceId: "source-1",
        contextSnippet: "  Manual context  ",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.mention.create).not.toHaveBeenCalled();
    });

    it("creates a mention from highlight text when linking a highlight", async () => {
      mockAuthenticatedUser();
      mockDb.entity.findFirst.mockResolvedValue(
        buildEntity({ id: "entity-1", dossier_id: "dos-1" }),
      );
      mockDb.highlight.findFirst.mockResolvedValue({
        id: "hl-1",
        quote_text: "Quoted evidence",
        source: { dossier_id: "dos-1" },
      });
      mockDb.mention.findFirst.mockResolvedValue(null);

      const result = await linkEntity({
        entityId: "entity-1",
        highlightId: "hl-1",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.mention.create).toHaveBeenCalledWith({
        data: {
          entity_id: "entity-1",
          highlight_id: "hl-1",
          context_snippet: "Quoted evidence",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/dossiers/dos-1", "layout");
    });
  });
});
