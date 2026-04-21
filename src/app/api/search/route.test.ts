import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAuth, mockAuthenticatedUser, resetTestMocks } from "@/test/mocks";

const { mockSearchWorkspace } = vi.hoisted(() => ({
  mockSearchWorkspace: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/server/queries/search", async () => {
  const actual = await vi.importActual<
    typeof import("@/server/queries/search")
  >("@/server/queries/search");
  return {
    ...actual,
    searchWorkspace: mockSearchWorkspace,
  };
});

import { GET } from "./route";

function makeRequest(url: string) {
  return { url } as never;
}

describe("GET /api/search", () => {
  beforeEach(() => {
    resetTestMocks();
    mockSearchWorkspace.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await GET(makeRequest("https://example.com/api/search?q=alpha"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockSearchWorkspace).not.toHaveBeenCalled();
  });

  it("delegates to searchWorkspace with the parsed query and dossier scope", async () => {
    mockAuthenticatedUser("user-1");
    const fake = {
      query: "alpha",
      dossierId: "dos-1",
      types: ["dossier"],
      groups: {
        dossier: [],
        source: [],
        highlight: [],
        claim: [],
        entity: [],
        brief: [],
      },
      total: 0,
    };
    mockSearchWorkspace.mockResolvedValue(fake);

    const response = await GET(
      makeRequest(
        "https://example.com/api/search?q=alpha&dossierId=dos-1&types=dossier,unknown",
      ),
    );

    expect(response.status).toBe(200);
    expect(mockSearchWorkspace).toHaveBeenCalledWith("user-1", "alpha", {
      dossierId: "dos-1",
      types: ["dossier"],
    });
    await expect(response.json()).resolves.toEqual(fake);
  });

  it("returns an empty result when the query is blank", async () => {
    mockAuthenticatedUser("user-1");
    mockSearchWorkspace.mockResolvedValue({
      query: "",
      dossierId: null,
      types: [],
      groups: {
        dossier: [],
        source: [],
        highlight: [],
        claim: [],
        entity: [],
        brief: [],
      },
      total: 0,
    });

    const response = await GET(makeRequest("https://example.com/api/search"));

    expect(response.status).toBe(200);
    expect(mockSearchWorkspace).toHaveBeenCalledWith("user-1", "", {
      dossierId: null,
      types: undefined,
    });
  });
});
