import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Dossier",
};

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg-canvas)",
        padding: "1.5rem",
      }}
    >
      <div
        className="panel-raised"
        style={{ width: "100%", maxWidth: "400px", padding: "2rem 2rem 1.75rem" }}
      >
        <div style={{ marginBottom: "1.75rem" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-accent-ink)",
              marginBottom: "0.75rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Dossier
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.625rem",
              fontWeight: 600,
              color: "var(--color-ink-primary)",
              marginBottom: "0.375rem",
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            Access your research workspace.
          </p>
        </div>

        <LoginForm />

        <hr className="divider" style={{ margin: "1.5rem 0 1.25rem" }} />

        <p
          style={{
            fontSize: "0.875rem",
            fontFamily: "var(--font-sans)",
            color: "var(--color-ink-secondary)",
            textAlign: "center",
          }}
        >
          No account?{" "}
          <a href="/signup" style={{ color: "var(--color-accent-ink)" }}>
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}
