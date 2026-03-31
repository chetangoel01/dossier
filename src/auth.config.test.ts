import { describe, expect, it } from "vitest";
import { authConfig } from "@/auth.config";

describe("authConfig.callbacks.authorized", () => {
  const authorized = authConfig.callbacks?.authorized;

  if (!authorized) {
    throw new Error("authorized callback is required");
  }

  function buildContext(pathname: string, signedIn = false) {
    return {
      auth: signedIn
        ? ({ user: { id: "user-1" }, expires: "2099-01-01T00:00:00.000Z" } as never)
        : null,
      request: {
        nextUrl: new URL(`http://localhost${pathname}`) as never,
      } as never,
    } as never;
  }

  it("allows auth API routes without a session", async () => {
    const result = await authorized(buildContext("/api/auth/session"));

    expect(result).toBe(true);
  });

  it("redirects signed-in users away from auth pages", async () => {
    const result = await authorized(buildContext("/login", true));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("location")).toBe(
      "http://localhost/dossiers",
    );
  });

  it("allows public routes without a session", async () => {
    const result = await authorized(buildContext("/"));

    expect(result).toBe(true);
  });

  it("returns a JSON 401 response for protected API routes without a session", async () => {
    const result = await authorized(buildContext("/api/sources/upload"));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
    await expect((result as Response).json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("rejects protected pages without a session", async () => {
    const result = await authorized(buildContext("/dossiers"));

    expect(result).toBe(false);
  });

  it("allows protected pages with a session", async () => {
    const result = await authorized(buildContext("/dossiers", true));

    expect(result).toBe(true);
  });
});
