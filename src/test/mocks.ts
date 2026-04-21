import { vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;
type MockDelegate = Record<string, MockFn>;

function createDelegate<const T extends readonly string[]>(
  methods: T,
): Record<T[number], MockFn> {
  return Object.fromEntries(methods.map((method) => [method, vi.fn()])) as Record<
    T[number],
    MockFn
  >;
}

export const mockAuth = vi.fn();
export const mockSignIn = vi.fn();
export const mockRevalidatePath = vi.fn();
export const mockRedirect = vi.fn();
export const mockRouterRefresh = vi.fn();
export const mockUseRouter = vi.fn(() => ({ refresh: mockRouterRefresh }));

export const mockDb = {
  user: createDelegate(["findUnique", "create"] as const),
  dossier: createDelegate(
    ["findFirst", "findMany", "create", "update", "delete"] as const,
  ),
  source: createDelegate(
    ["findFirst", "findMany", "create", "update", "delete"] as const,
  ),
  highlight: createDelegate(
    ["findFirst", "findMany", "create", "delete", "count"] as const,
  ),
  claim: createDelegate(
    ["findFirst", "findMany", "create", "update", "delete"] as const,
  ),
  entity: createDelegate(
    ["findFirst", "findMany", "create", "update", "delete", "count"] as const,
  ),
  mention: createDelegate(["findFirst", "create"] as const),
  claimEntity: createDelegate(["upsert"] as const),
  event: createDelegate(
    ["findFirst", "findMany", "create", "update", "delete"] as const,
  ),
  eventHighlight: createDelegate(["upsert", "delete"] as const),
  eventEntity: createDelegate(["upsert", "delete"] as const),
} as const;

function resetDelegate(delegate: MockDelegate) {
  Object.values(delegate).forEach((fn) => fn.mockReset());
}

export function resetTestMocks() {
  mockAuth.mockReset();
  mockAuth.mockResolvedValue(null);

  mockSignIn.mockReset();
  mockSignIn.mockResolvedValue(undefined);

  mockRevalidatePath.mockReset();
  mockRedirect.mockReset();
  mockRedirect.mockImplementation((path: string) => {
    throw new Error(`redirect:${path}`);
  });

  mockRouterRefresh.mockReset();
  mockUseRouter.mockReset();
  mockUseRouter.mockImplementation(() => ({ refresh: mockRouterRefresh }));

  resetDelegate(mockDb.user);
  resetDelegate(mockDb.dossier);
  resetDelegate(mockDb.source);
  resetDelegate(mockDb.highlight);
  resetDelegate(mockDb.claim);
  resetDelegate(mockDb.entity);
  resetDelegate(mockDb.mention);
  resetDelegate(mockDb.claimEntity);
  resetDelegate(mockDb.event);
  resetDelegate(mockDb.eventHighlight);
  resetDelegate(mockDb.eventEntity);
}

export function mockAuthenticatedUser(userId = "user-1") {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}
