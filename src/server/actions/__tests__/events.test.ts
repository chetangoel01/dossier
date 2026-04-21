import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDossier,
  buildEntity,
  buildEvent,
  buildHighlight,
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
  createEvent,
  deleteEvent,
  linkEventEntity,
  linkEventHighlight,
  unlinkEventEntity,
  unlinkEventHighlight,
  updateEvent,
} from "../events";

describe("event actions", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe("createEvent", () => {
    it("requires authentication", async () => {
      const result = await createEvent({
        dossierId: "dos-1",
        title: "Launch",
      });
      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("validates required fields", async () => {
      mockAuthenticatedUser();

      await expect(
        createEvent({ dossierId: "", title: "Launch" }),
      ).resolves.toEqual({ error: "Dossier ID is required." });
      await expect(
        createEvent({ dossierId: "dos-1", title: "   " }),
      ).resolves.toEqual({ error: "Event title is required." });
      await expect(
        createEvent({
          dossierId: "dos-1",
          title: "Launch",
          precision: "invalid" as never,
        }),
      ).resolves.toEqual({
        error: "Invalid precision. Must be one of: day, month, year, unknown.",
      });
      await expect(
        createEvent({
          dossierId: "dos-1",
          title: "Launch",
          precision: "day",
        }),
      ).resolves.toEqual({ error: "Event date is required for this precision." });
      await expect(
        createEvent({
          dossierId: "dos-1",
          title: "Launch",
          confidence: 200,
        }),
      ).resolves.toEqual({ error: "Confidence must be between 0 and 100." });
    });

    it("rejects dossiers outside the current account", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(null);

      const result = await createEvent({
        dossierId: "dos-1",
        title: "Launch",
      });
      expect(result).toEqual({ error: "Dossier not found." });
    });

    it("creates an event with day precision and normalizes the date to UTC midnight", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.event.create.mockResolvedValue({ id: "evt-1" });

      const result = await createEvent({
        dossierId: "dos-1",
        title: "  Launch  ",
        description: "  Product launch  ",
        eventDate: "2026-03-15T14:32:00Z",
        precision: "day",
        confidence: 90,
      });

      expect(result).toEqual({ id: "evt-1" });
      const call = mockDb.event.create.mock.calls[0][0];
      expect(call.data.title).toBe("Launch");
      expect(call.data.description).toBe("Product launch");
      expect(call.data.precision).toBe("day");
      expect(call.data.confidence).toBe(90);
      expect(call.data.event_date).toEqual(new Date(Date.UTC(2026, 2, 15)));
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dossiers/dos-1",
        "layout",
      );
    });

    it("normalizes month-precision dates to the first of the month", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.event.create.mockResolvedValue({ id: "evt-1" });

      await createEvent({
        dossierId: "dos-1",
        title: "Mid-March",
        eventDate: "2026-03-15",
        precision: "month",
      });

      const call = mockDb.event.create.mock.calls[0][0];
      expect(call.data.event_date).toEqual(new Date(Date.UTC(2026, 2, 1)));
      expect(call.data.precision).toBe("month");
    });

    it("normalizes year-precision dates to January 1", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.event.create.mockResolvedValue({ id: "evt-1" });

      await createEvent({
        dossierId: "dos-1",
        title: "Sometime in 2026",
        eventDate: "2026-09-20",
        precision: "year",
      });

      const call = mockDb.event.create.mock.calls[0][0];
      expect(call.data.event_date).toEqual(new Date(Date.UTC(2026, 0, 1)));
      expect(call.data.precision).toBe("year");
    });

    it("allows unknown-precision events without a date", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.event.create.mockResolvedValue({ id: "evt-1" });

      await createEvent({
        dossierId: "dos-1",
        title: "Unknown date",
      });

      const call = mockDb.event.create.mock.calls[0][0];
      expect(call.data.event_date).toBeNull();
      expect(call.data.precision).toBe("unknown");
    });

    it("attaches highlights and entities at creation time after verifying ownership", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.highlight.count.mockResolvedValue(2);
      mockDb.entity.count.mockResolvedValue(1);
      mockDb.event.create.mockResolvedValue({ id: "evt-1" });

      await createEvent({
        dossierId: "dos-1",
        title: "Launch",
        highlightIds: ["hl-1", "hl-2", "hl-1"],
        entityIds: ["ent-1"],
      });

      const call = mockDb.event.create.mock.calls[0][0];
      expect(call.data.highlights).toEqual({
        create: [{ highlight_id: "hl-1" }, { highlight_id: "hl-2" }],
      });
      expect(call.data.entities).toEqual({
        create: [{ entity_id: "ent-1" }],
      });
      expect(mockDb.highlight.count).toHaveBeenCalledWith({
        where: {
          id: { in: ["hl-1", "hl-2"] },
          source: { dossier_id: "dos-1" },
        },
      });
    });

    it("rejects highlights from other dossiers", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.highlight.count.mockResolvedValue(0);

      const result = await createEvent({
        dossierId: "dos-1",
        title: "Launch",
        highlightIds: ["hl-1"],
      });

      expect(result).toEqual({
        error: "One or more highlights not found in this dossier.",
      });
      expect(mockDb.event.create).not.toHaveBeenCalled();
    });

    it("rejects claims that do not belong to the dossier", async () => {
      mockAuthenticatedUser();
      mockDb.dossier.findFirst.mockResolvedValue(buildDossier({ id: "dos-1" }));
      mockDb.claim.findFirst.mockResolvedValue(null);

      const result = await createEvent({
        dossierId: "dos-1",
        title: "Launch",
        claimId: "claim-x",
      });

      expect(result).toEqual({ error: "Claim not found in this dossier." });
    });
  });

  describe("updateEvent", () => {
    it("requires authentication", async () => {
      const result = await updateEvent({ id: "evt-1", title: "New" });
      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("rejects unknown events", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(null);

      const result = await updateEvent({ id: "evt-1", title: "New" });
      expect(result).toEqual({ error: "Event not found." });
    });

    it("updates fields, normalizes the date to the new precision, and revalidates", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1", precision: "day" }),
      );
      mockDb.event.update.mockResolvedValue(buildEvent({ id: "evt-1" }));

      const result = await updateEvent({
        id: "evt-1",
        title: "Updated",
        precision: "month",
        eventDate: "2026-03-15",
        confidence: 50,
      });

      expect(result).toEqual({ success: true });
      const call = mockDb.event.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: "evt-1" });
      expect(call.data.title).toBe("Updated");
      expect(call.data.precision).toBe("month");
      expect(call.data.event_date).toEqual(new Date(Date.UTC(2026, 2, 1)));
      expect(call.data.confidence).toBe(50);
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dossiers/dos-1",
        "layout",
      );
    });

    it("re-snaps the existing date when only precision changes", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({
          id: "evt-1",
          dossier_id: "dos-1",
          precision: "day",
          event_date: new Date(Date.UTC(2026, 2, 15)),
        }),
      );
      mockDb.event.update.mockResolvedValue(buildEvent({ id: "evt-1" }));

      await updateEvent({ id: "evt-1", precision: "year" });

      const call = mockDb.event.update.mock.calls[0][0];
      expect(call.data.precision).toBe("year");
      expect(call.data.event_date).toEqual(new Date(Date.UTC(2026, 0, 1)));
    });

    it("rejects a non-unknown precision update when the event has no resolvable date", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({
          id: "evt-1",
          dossier_id: "dos-1",
          precision: "unknown",
          event_date: null,
        }),
      );

      const result = await updateEvent({
        id: "evt-1",
        precision: "day",
        eventDate: null,
      });

      expect(result).toEqual({
        error: "Event date is required for this precision.",
      });
      expect(mockDb.event.update).not.toHaveBeenCalled();
    });

    it("clears the date when switching to unknown precision", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1", precision: "day" }),
      );
      mockDb.event.update.mockResolvedValue(buildEvent({ id: "evt-1" }));

      await updateEvent({ id: "evt-1", precision: "unknown" });

      const call = mockDb.event.update.mock.calls[0][0];
      expect(call.data.precision).toBe("unknown");
      expect(call.data.event_date).toBeNull();
    });
  });

  describe("deleteEvent", () => {
    it("requires authentication", async () => {
      const result = await deleteEvent("evt-1");
      expect(result).toEqual({ error: "You must be signed in." });
    });

    it("removes owned events", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1" }),
      );
      mockDb.event.delete.mockResolvedValue(buildEvent({ id: "evt-1" }));

      const result = await deleteEvent("evt-1");

      expect(result).toEqual({ success: true });
      expect(mockDb.event.delete).toHaveBeenCalledWith({ where: { id: "evt-1" } });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/dossiers/dos-1",
        "layout",
      );
    });
  });

  describe("linkEventHighlight", () => {
    it("verifies the highlight belongs to the same dossier", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1" }),
      );
      mockDb.highlight.findFirst.mockResolvedValue(null);

      const result = await linkEventHighlight({
        eventId: "evt-1",
        highlightId: "hl-1",
      });

      expect(result).toEqual({
        error: "Highlight not found in this dossier.",
      });
    });

    it("upserts the join row when ownership checks pass", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1" }),
      );
      mockDb.highlight.findFirst.mockResolvedValue(
        buildHighlight({ id: "hl-1" }),
      );

      const result = await linkEventHighlight({
        eventId: "evt-1",
        highlightId: "hl-1",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.eventHighlight.upsert).toHaveBeenCalledWith({
        where: {
          event_id_highlight_id: {
            event_id: "evt-1",
            highlight_id: "hl-1",
          },
        },
        update: {},
        create: { event_id: "evt-1", highlight_id: "hl-1" },
      });
    });
  });

  describe("unlinkEventHighlight", () => {
    it("removes the join row", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1" }),
      );

      const result = await unlinkEventHighlight({
        eventId: "evt-1",
        highlightId: "hl-1",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.eventHighlight.delete).toHaveBeenCalledWith({
        where: {
          event_id_highlight_id: {
            event_id: "evt-1",
            highlight_id: "hl-1",
          },
        },
      });
    });
  });

  describe("linkEventEntity", () => {
    it("verifies the entity belongs to the same dossier", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1" }),
      );
      mockDb.entity.findFirst.mockResolvedValue(null);

      const result = await linkEventEntity({
        eventId: "evt-1",
        entityId: "ent-1",
      });

      expect(result).toEqual({ error: "Entity not found in this dossier." });
    });

    it("upserts the join row when ownership checks pass", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1" }),
      );
      mockDb.entity.findFirst.mockResolvedValue(buildEntity({ id: "ent-1" }));

      const result = await linkEventEntity({
        eventId: "evt-1",
        entityId: "ent-1",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.eventEntity.upsert).toHaveBeenCalledWith({
        where: {
          event_id_entity_id: { event_id: "evt-1", entity_id: "ent-1" },
        },
        update: {},
        create: { event_id: "evt-1", entity_id: "ent-1" },
      });
    });
  });

  describe("unlinkEventEntity", () => {
    it("removes the join row", async () => {
      mockAuthenticatedUser();
      mockDb.event.findFirst.mockResolvedValue(
        buildEvent({ id: "evt-1", dossier_id: "dos-1" }),
      );

      const result = await unlinkEventEntity({
        eventId: "evt-1",
        entityId: "ent-1",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.eventEntity.delete).toHaveBeenCalledWith({
        where: {
          event_id_entity_id: { event_id: "evt-1", entity_id: "ent-1" },
        },
      });
    });
  });
});
