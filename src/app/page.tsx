import { SectionFrame } from "@/components/ui/SectionFrame";

export default function Home() {
  return (
    <main style={{ minHeight: "100dvh", backgroundColor: "var(--color-bg-canvas)" }}>
      <SectionFrame>
        <h1 style={{ marginBottom: "0.5rem" }}>Dossier</h1>
        <p className="text-muted" style={{ fontFamily: "var(--font-sans)", marginBottom: "2rem" }}>
          A private, evidence-first research workspace.
        </p>

        <hr className="divider" style={{ marginBottom: "2rem" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)" }}>Typography</h3>
          <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-ink-secondary)" }}>
            Body copy in IBM Plex Sans. Dense without feeling busy.
          </p>
          <p className="text-mono" style={{ fontSize: "0.875rem", color: "var(--color-ink-secondary)" }}>
            Citation metadata · source/001 · p. 12 · IBM Plex Mono
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-danger">Danger</button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <span className="chip">unreviewed</span>
          <span className="chip chip-citation">src/001</span>
          <span className="chip chip-success">supported</span>
          <span className="chip chip-alert">contested</span>
          <span className="chip chip-warning">draft</span>
        </div>

        <div className="panel-raised" style={{ padding: "1.25rem", marginBottom: "2rem" }}>
          <p className="rule-left" style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--color-ink-secondary)" }}>
            &ldquo;Evidence cards use a left rule and source stamp &mdash; not loud drop shadows.&rdquo;
          </p>
        </div>

        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-ink-secondary)" }}>
          Research workspace — coming soon.
        </p>
      </SectionFrame>
    </main>
  );
}
