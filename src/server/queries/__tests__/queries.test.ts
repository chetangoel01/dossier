import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDossier, buildSource } from "@/lib/test-utils/factories";
import { mockDb, resetTestMocks } from "@/test/mocks";

vi.mock("@/lib/db", () => ({ db: mockDb }));

import {
  getDossier,
  getDossiers,
} from "../dossiers";
import { getEntities } from "../entities";
import { getClaims, getClaimsForSource } from "../claims";
import {
  getSource,
  getSourceForReader,
  getSources,
} from "../sources";

describe("server queries", () => {
  beforeEach(() => {
    resetTestMocks();
  });

  it("gets active dossiers ordered by update time", async () => {
    const expected = [{ id: "dos-1" }];
    mockDb.dossier.findMany.mockResolvedValue(expected);

    await expect(getDossiers("user-1")).resolves.toBe(expected);
    expect(mockDb.dossier.findMany).toHaveBeenCalledWith({
      where: {
        owner_id: "user-1",
        status: "active",
      },
      orderBy: { updated_at: "desc" },
      select: expect.any(Object),
    });
  });

  it("gets a single dossier for the current owner", async () => {
    const dossier = buildDossier({ id: "dos-1", owner_id: "user-1" });
    mockDb.dossier.findFirst.mockResolvedValue(dossier);

    await expect(getDossier("dos-1", "user-1")).resolves.toBe(dossier);
    expect(mockDb.dossier.findFirst).toHaveBeenCalledWith({
      where: { id: "dos-1", owner_id: "user-1" },
    });
  });

  it("gets dossier sources with tag and highlight counts", async () => {
    const sources = [{ id: "source-1" }];
    mockDb.source.findMany.mockResolvedValue(sources);

    await expect(getSources("dos-1", "user-1")).resolves.toBe(sources);
    expect(mockDb.source.findMany).toHaveBeenCalledWith({
      where: {
        dossier_id: "dos-1",
        dossier: { owner_id: "user-1" },
      },
      orderBy: { created_at: "desc" },
      select: expect.any(Object),
    });
  });

  it("gets a single source scoped to the current owner", async () => {
    const source = buildSource({ id: "source-1", dossier_id: "dos-1" });
    mockDb.source.findFirst.mockResolvedValue(source);

    await expect(getSource("source-1", "user-1")).resolves.toBe(source);
    expect(mockDb.source.findFirst).toHaveBeenCalledWith({
      where: {
        id: "source-1",
        dossier: { owner_id: "user-1" },
      },
    });
  });

  it("gets a reader-ready source payload with related evidence", async () => {
    const readerData = { id: "source-1", highlights: [] };
    mockDb.source.findFirst.mockResolvedValue(readerData);

    await expect(
      getSourceForReader("source-1", "dos-1", "user-1"),
    ).resolves.toBe(readerData);
    expect(mockDb.source.findFirst).toHaveBeenCalledWith({
      where: {
        id: "source-1",
        dossier_id: "dos-1",
        dossier: { owner_id: "user-1" },
      },
      include: expect.any(Object),
    });
  });

  it("gets dossier entities ordered by recency and name", async () => {
    const entities = [{ id: "entity-1" }];
    mockDb.entity.findMany.mockResolvedValue(entities);

    await expect(getEntities("dos-1", "user-1")).resolves.toBe(entities);
    expect(mockDb.entity.findMany).toHaveBeenCalledWith({
      where: {
        dossier_id: "dos-1",
        dossier: { owner_id: "user-1" },
      },
      orderBy: [{ updated_at: "desc" }, { name: "asc" }],
      select: expect.any(Object),
    });
  });

  it("gets dossier claims with linked highlights and entities", async () => {
    const claims = [{ id: "claim-1" }];
    mockDb.claim.findMany.mockResolvedValue(claims);

    await expect(getClaims("dos-1", "user-1")).resolves.toBe(claims);
    expect(mockDb.claim.findMany).toHaveBeenCalledWith({
      where: {
        dossier_id: "dos-1",
        dossier: { owner_id: "user-1" },
      },
      orderBy: { created_at: "desc" },
      select: expect.any(Object),
    });
  });

  it("gets claims linked to a source", async () => {
    const claims = [{ id: "claim-1" }];
    mockDb.claim.findMany.mockResolvedValue(claims);

    await expect(
      getClaimsForSource("source-1", "dos-1", "user-1"),
    ).resolves.toBe(claims);
    expect(mockDb.claim.findMany).toHaveBeenCalledWith({
      where: {
        dossier_id: "dos-1",
        dossier: { owner_id: "user-1" },
        highlights: {
          some: {
            highlight: { source_id: "source-1" },
          },
        },
      },
      orderBy: { created_at: "desc" },
      select: expect.any(Object),
    });
  });
});
