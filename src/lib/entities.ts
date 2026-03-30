import type { EntityType } from "@prisma/client";

export const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: "person", label: "Person" },
  { value: "company", label: "Company" },
  { value: "product", label: "Product" },
  { value: "location", label: "Location" },
  { value: "institution", label: "Institution" },
  { value: "topic", label: "Topic" },
];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  person: "Person",
  company: "Company",
  product: "Product",
  location: "Location",
  institution: "Institution",
  topic: "Topic",
};

export function parseEntityAliases(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\n,]/)
        .map((alias) => alias.trim())
        .filter(Boolean),
    ),
  );
}

export function formatEntityAliases(aliases: string[]): string {
  return aliases.join(", ");
}

export function buildContextSnippet(
  input: string | null | undefined,
  maxLength = 180,
): string | null {
  const normalized = input?.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}
