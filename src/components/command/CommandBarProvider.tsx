"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CommandBar } from "./CommandBar";

export interface DossierCommandContext {
  id: string;
  title: string;
}

interface CommandBarState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setDossierContext: (ctx: DossierCommandContext | null) => void;
  dossier: DossierCommandContext | null;
}

const CommandBarStateContext = createContext<CommandBarState | null>(null);

export function CommandBarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dossier, setDossier] = useState<DossierCommandContext | null>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const value = useMemo<CommandBarState>(
    () => ({
      open,
      setOpen,
      toggle,
      setDossierContext: setDossier,
      dossier,
    }),
    [open, toggle, dossier],
  );

  return (
    <CommandBarStateContext.Provider value={value}>
      {children}
      <CommandBar
        open={open}
        onClose={() => setOpen(false)}
        dossier={dossier}
      />
    </CommandBarStateContext.Provider>
  );
}

export function useCommandBar(): CommandBarState {
  const ctx = useContext(CommandBarStateContext);
  if (!ctx) {
    throw new Error("useCommandBar must be used within a CommandBarProvider");
  }
  return ctx;
}

export function useRegisterDossierContext(
  dossier: DossierCommandContext | null,
) {
  const { setDossierContext } = useCommandBar();
  useEffect(() => {
    setDossierContext(dossier);
    return () => setDossierContext(null);
  }, [dossier, setDossierContext]);
}
