import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockAuth, mockAuthenticatedUser, resetTestMocks } from "@/test/mocks";

const { mockValidateUrlForFetch } = vi.hoisted(() => ({
  mockValidateUrlForFetch: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/ssrf", () => ({ validateUrlForFetch: mockValidateUrlForFetch }));

import { POST } from "./route";

describe("POST /api/sources/prefetch-url", () => {
  beforeEach(() => {
    resetTestMocks();
    mockValidateUrlForFetch.mockReset();
    mockValidateUrlForFetch.mockResolvedValue({ safe: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await POST({
      json: vi.fn(),
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects invalid JSON payloads", async () => {
    mockAuthenticatedUser();

    const response = await POST({
      json: vi.fn().mockRejectedValue(new Error("bad json")),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid request body",
    });
  });

  it("requires a URL", async () => {
    mockAuthenticatedUser();

    const response = await POST({
      json: vi.fn().mockResolvedValue({}),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "URL is required" });
  });

  it("rejects malformed URLs", async () => {
    mockAuthenticatedUser();

    const response = await POST({
      json: vi.fn().mockResolvedValue({ url: "not-a-url" }),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid URL" });
  });

  it("rejects SSRF-blocked URLs", async () => {
    mockAuthenticatedUser();
    mockValidateUrlForFetch.mockResolvedValue({
      safe: false,
      reason: "URL resolves to a blocked address",
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "URL resolves to a blocked address",
    });
  });

  it("returns a null title for non-success responses", async () => {
    mockAuthenticatedUser();
    const fetchMock = vi.fn().mockResolvedValue(new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST({
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ title: null });
  });

  it("returns a null title for non-html responses", async () => {
    mockAuthenticatedUser();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST({
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as never);

    await expect(response.json()).resolves.toEqual({ title: null });
  });

  it("extracts and trims the document title", async () => {
    mockAuthenticatedUser();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        "<html><head><title>  Example   Title </title></head><body /></html>",
        {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST({
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as never);

    await expect(response.json()).resolves.toEqual({ title: "Example Title" });
  });

  it("returns a null title when the response body is unavailable", async () => {
    mockAuthenticatedUser();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST({
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as never);

    await expect(response.json()).resolves.toEqual({ title: null });
  });

  it("returns a null title when the network request fails", async () => {
    mockAuthenticatedUser();
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST({
      json: vi.fn().mockResolvedValue({ url: "https://example.com" }),
    } as never);

    await expect(response.json()).resolves.toEqual({ title: null });
  });
});
