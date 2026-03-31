import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockDb,
  mockSignIn,
  resetTestMocks,
} from "@/test/mocks";

const { MockAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
}));

vi.mock("next-auth", () => ({ AuthError: MockAuthError }));
vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/auth", () => ({ signIn: mockSignIn }));

import { signup } from "../auth";

describe("signup", () => {
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

  it("requires email and password", async () => {
    const result = await signup(buildFormData({ name: "Analyst" }));

    expect(result).toEqual({ error: "Email and password are required." });
  });

  it("requires a minimum password length", async () => {
    const result = await signup(
      buildFormData({
        email: "analyst@example.com",
        password: "short",
      }),
    );

    expect(result).toEqual({ error: "Password must be at least 8 characters." });
  });

  it("rejects duplicate accounts", async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: "user-1" });

    const result = await signup(
      buildFormData({
        email: "analyst@example.com",
        password: "password123",
      }),
    );

    expect(result).toEqual({
      error: "An account with this email already exists.",
    });
    expect(mockDb.user.create).not.toHaveBeenCalled();
  });

  it("creates an account and signs the user in", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    const result = await signup(
      buildFormData({
        email: " analyst@example.com ",
        password: "password123",
        name: " Analyst ",
      }),
    );

    expect(result).toBeUndefined();
    expect(mockDb.user.create).toHaveBeenCalledTimes(1);
    expect(mockDb.user.create.mock.calls[0][0]).toMatchObject({
      data: {
        email: "analyst@example.com",
        name: "Analyst",
      },
    });
    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "analyst@example.com",
      password: "password123",
      redirectTo: "/dossiers",
    });
  });

  it("returns a friendly message when auto sign-in fails with an auth error", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockSignIn.mockRejectedValue(new MockAuthError("CredentialsSignin"));

    const result = await signup(
      buildFormData({
        email: "analyst@example.com",
        password: "password123",
      }),
    );

    expect(result).toEqual({ error: "Account created. Please sign in." });
  });

  it("rethrows unexpected sign-in failures", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockSignIn.mockRejectedValue(new Error("boom"));

    await expect(
      signup(
        buildFormData({
          email: "analyst@example.com",
          password: "password123",
        }),
      ),
    ).rejects.toThrow("boom");
  });
});
