"use client";

import { SessionProvider } from "next-auth/react";
import { CommandBarProvider } from "@/components/command/CommandBarProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CommandBarProvider>{children}</CommandBarProvider>
    </SessionProvider>
  );
}
