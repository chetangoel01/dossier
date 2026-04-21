import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQueryRaw } = vi.hoisted(() => ({
  mockQueryRaw: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { $queryRaw: mockQueryRaw },
}));

import {
  SEARCH_OBJECT_TYPES,
  searchWorkspace,
} from "../search";

describe("searchWorkspace", () => {
  beforeEach(() => {
    mockQueryRaw.mockReset();
  });

  it("returns an empty grouped result set for a blank query without hitting the db", async () => {
    const result = await searchWorkspace("user-1", "   ");

    expect(result.total).toBe(0);
    expect(result.query).toBe("");
    expect(mockQueryRaw).not.toHaveBeenCalled();
    for (const type of SEARCH_OBJECT_TYPES) {
      expect(result.groups[type]).toEqual([]);
    }
  });

  it("runs one raw query per requested type and groups results by object type", async () => {
    // Return one synthetic row per type so we can confirm grouping.
    mockQueryRaw
      .mockResolvedValueOnce([
        {
          id: "dos-1",
          title: "Dossier One",
          snippet: "<<alpha>> summary",
          dossier_id: "dos-1",
          dossier_title: "Dossier One",
          rank: 0.5,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "src-1",
          title: "Source One",
          snippet: null,
          dossier_id: "dos-1",
          dossier_title: "Dossier One",
          rank: 0.4,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "hl-1",
          title: "Highlighted quote",
          snippet: null,
          dossier_id: "dos-1",
          dossier_title: "Dossier One",
          source_id: "src-1",
          rank: 0.3,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "clm-1",
          title: "A claim",
          snippet: null,
          dossier_id: "dos-1",
          dossier_title: "Dossier One",
          rank: 0.2,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "ent-1",
          title: "Acme Corp",
          snippet: null,
          dossier_id: "dos-1",
          dossier_title: "Dossier One",
          rank: 0.1,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "brf-1",
          title: "Brief One",
          snippet: null,
          dossier_id: "dos-1",
          dossier_title: "Dossier One",
          rank: 0.05,
        },
      ]);

    const result = await searchWorkspace("user-1", "alpha");

    expect(mockQueryRaw).toHaveBeenCalledTimes(SEARCH_OBJECT_TYPES.length);
    expect(result.total).toBe(SEARCH_OBJECT_TYPES.length);
    expect(result.groups.dossier[0]).toMatchObject({
      id: "dos-1",
      type: "dossier",
      href: "/dossiers/dos-1/overview",
    });
    expect(result.groups.source[0]).toMatchObject({
      type: "source",
      href: "/dossiers/dos-1/sources/src-1",
    });
    expect(result.groups.highlight[0]).toMatchObject({
      type: "highlight",
      href: "/dossiers/dos-1/sources/src-1#highlight-hl-1",
    });
    expect(result.groups.claim[0]).toMatchObject({
      type: "claim",
      href: "/dossiers/dos-1/claims#claim-clm-1",
    });
    expect(result.groups.entity[0]).toMatchObject({
      type: "entity",
      href: "/dossiers/dos-1/entities#entity-ent-1",
    });
    expect(result.groups.brief[0]).toMatchObject({
      type: "brief",
      href: "/dossiers/dos-1/brief",
    });
  });

  it("honors an explicit object-type filter and only runs those queries", async () => {
    mockQueryRaw.mockResolvedValue([]);

    const result = await searchWorkspace("user-1", "alpha", {
      types: ["claim", "entity"],
    });

    expect(mockQueryRaw).toHaveBeenCalledTimes(2);
    expect(result.types).toEqual(["claim", "entity"]);
  });

  it("passes the dossier scope into every raw query", async () => {
    mockQueryRaw.mockResolvedValue([]);

    await searchWorkspace("user-1", "alpha", { dossierId: "dos-9" });

    expect(mockQueryRaw).toHaveBeenCalledTimes(SEARCH_OBJECT_TYPES.length);
    // Each call receives a Prisma.sql tagged template — we just ensure the
    // dossier id is present in the interpolated values for every call.
    for (const call of mockQueryRaw.mock.calls) {
      const serialized = JSON.stringify(call);
      expect(serialized).toContain("dos-9");
    }
  });

  it("cleans up whitespace in snippets returned from ts_headline", async () => {
    mockQueryRaw
      .mockResolvedValueOnce([
        {
          id: "dos-1",
          title: "Dossier One",
          snippet: "  lots   of\n\n whitespace  ",
          dossier_id: "dos-1",
          dossier_title: "Dossier One",
          rank: 0.5,
        },
      ])
      .mockResolvedValue([]);

    const result = await searchWorkspace("user-1", "alpha", {
      types: ["dossier"],
    });

    expect(result.groups.dossier[0].snippet).toBe("lots of whitespace");
  });

  it("truncates very long claim statements used as titles", async () => {
    const longStatement = "x".repeat(200);
    mockQueryRaw.mockResolvedValueOnce([
      {
        id: "clm-1",
        title: longStatement,
        snippet: null,
        dossier_id: "dos-1",
        dossier_title: "Dossier One",
        rank: 0.1,
      },
    ]);

    const result = await searchWorkspace("user-1", "alpha", {
      types: ["claim"],
    });

    expect(result.groups.claim[0].title.length).toBeLessThan(longStatement.length);
    expect(result.groups.claim[0].title.endsWith("…")).toBe(true);
  });
});
