import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SectionFrame } from "@/components/ui/SectionFrame";
import { WorkflowStrip } from "@/components/ui/WorkflowStrip";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dossiers");
  }

  return (
    <main style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg-canvas)" }}>
      <SectionFrame>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "5rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.125rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            Dossier
          </span>
          <Link
            href="/login"
            className="btn btn-ghost"
            style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem" }}
          >
            Sign in
          </Link>
        </header>

        <section style={{ maxWidth: "44rem", marginBottom: "4rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              lineHeight: 1.1,
              fontWeight: 500,
              marginBottom: "1.5rem",
            }}
          >
            Evidence-first research,{" "}
            <em style={{ fontStyle: "italic", fontWeight: 500 }}>end to end</em>.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.125rem",
              lineHeight: 1.55,
              color: "var(--color-ink-secondary)",
              marginBottom: "2rem",
              maxWidth: "36rem",
            }}
          >
            Capture sources, mark the passages that matter, build briefs that cite
            themselves. A private analyst&apos;s workbench &mdash; not a notes app.
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5rem" }}>
            <Link href="/signup" className="btn btn-primary">
              Start a dossier
            </Link>
            <Link
              href="/login"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9375rem",
                color: "var(--color-ink-secondary)",
                textDecoration: "underline",
                textUnderlineOffset: "0.25em",
              }}
            >
              Already have an account? Sign in
            </Link>
          </div>
        </section>

        <hr className="divider" style={{ marginBottom: "2.5rem" }} />

        <section style={{ marginBottom: "5rem" }}>
          <WorkflowStrip />
        </section>

        <p
          className="text-mono"
          style={{
            fontSize: "0.75rem",
            color: "var(--color-ink-secondary)",
          }}
        >
          Private workspace · your sources stay yours
        </p>
      </SectionFrame>
    </main>
  );
}
