import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getDossiers } from "@/server/queries/dossiers";
import { DossiersClient } from "@/components/dossiers/DossiersClient";

export const metadata: Metadata = {
  title: "Dossiers — Dossier",
};

export default async function DossiersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const dossiers = await getDossiers(session.user.id);

  return (
    <main
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg-canvas)",
        padding: "2rem var(--space-gutter)",
      }}
    >
      <div style={{ maxWidth: "var(--space-content-max)", marginInline: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
            paddingBottom: "1rem",
            borderBottom: "var(--border-thin) solid var(--color-border)",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                color: "var(--color-ink-primary)",
                marginBottom: "0.25rem",
              }}
            >
              Dossiers
            </h1>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              {session.user.email}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn btn-ghost">
              Sign out
            </button>
          </form>
        </div>

        <DossiersClient dossiers={dossiers} />
      </div>
    </main>
  );
}
