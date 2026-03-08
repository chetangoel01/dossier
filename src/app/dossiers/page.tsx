import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getDossiers } from "@/server/queries/dossiers";
import { DossierList } from "@/components/dossiers/DossierList";

export const metadata: Metadata = {
  title: "Dossiers — Dossier",
};

export default async function DossiersPage() {
  const session = await auth();

  if (!session?.user?.id) {
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
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "2rem",
            paddingBottom: "1.25rem",
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
                maxWidth: "none",
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

        <DossierList dossiers={dossiers} />
      </div>
    </main>
  );
}
