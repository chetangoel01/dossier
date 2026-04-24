"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface WorkspacePaneTransitionProps {
  children: ReactNode;
}

/**
 * Re-triggers the soft fade/slide-in animation each time the user switches
 * workspace tabs. Keying on pathname forces React to remount the wrapper so
 * the CSS animation replays on every navigation.
 */
export function WorkspacePaneTransition({
  children,
}: WorkspacePaneTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="anim-tab-enter flex flex-col flex-1 min-h-0"
    >
      {children}
    </div>
  );
}
