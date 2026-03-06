"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/server/actions/auth";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dossiers");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {error && (
        <p
          role="alert"
          style={{
            fontSize: "0.875rem",
            fontFamily: "var(--font-sans)",
            color: "var(--color-accent-alert)",
          }}
        >
          {error}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="signup-name"
          style={{ fontSize: "0.8125rem", fontFamily: "var(--font-sans)", color: "var(--color-ink-secondary)" }}
        >
          Name <span style={{ opacity: 0.6 }}>(optional)</span>
        </label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          className="input"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="signup-email"
          style={{ fontSize: "0.8125rem", fontFamily: "var(--font-sans)", color: "var(--color-ink-secondary)" }}
        >
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        <label
          htmlFor="signup-password"
          style={{ fontSize: "0.8125rem", fontFamily: "var(--font-sans)", color: "var(--color-ink-secondary)" }}
        >
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="input"
        />
        <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-ink-secondary)", opacity: 0.8 }}>
          Minimum 8 characters
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
