"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  useRegisterDossierContext,
  type DossierCommandContext,
} from "./CommandBarProvider";

const TAB_SLUGS = [
  "overview",
  "sources",
  "claims",
  "entities",
  "timeline",
  "brief",
  "activity",
] as const;

interface Props {
  dossier: DossierCommandContext;
}

/**
 * Registers the current dossier with the command bar and wires keyboard
 * shortcuts for tab navigation and inspector toggling. Mounted inside the
 * dossier layout so it scopes cleanly to /dossiers/[id]/*.
 */
export function DossierWorkspaceShortcuts({ dossier }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  useRegisterDossierContext(dossier);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "[" || event.key === "]") {
        event.preventDefault();
        const prefix = `/dossiers/${dossier.id}/`;
        const current = TAB_SLUGS.findIndex((slug) =>
          pathname.startsWith(`${prefix}${slug}`),
        );
        const base = current === -1 ? 0 : current;
        const next =
          event.key === "]"
            ? (base + 1) % TAB_SLUGS.length
            : (base - 1 + TAB_SLUGS.length) % TAB_SLUGS.length;
        router.push(`${prefix}${TAB_SLUGS[next]}`);
        return;
      }

      if (event.key === "\\") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("dossier:toggle-inspector"));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dossier.id, pathname, router]);

  return null;
}
