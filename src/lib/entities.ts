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
        .filter(Boolean)
    )
  );
}

export function formatEntityAliases(aliases: string[]): string {
  return aliases.join(", ");
}

export function buildContextSnippet(
  input: string | null | undefined,
  maxLength = 180
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

type MentionSourceLike = {
  id: string;
  title: string;
  captured_at: Date | string;
};

type MentionHighlightLike = {
  id: string;
  quote_text: string;
  source: MentionSourceLike | null;
};

export type EntityMentionLike = {
  id: string;
  source_id: string | null;
  highlight_id: string | null;
  context_snippet: string | null;
  source: MentionSourceLike | null;
  highlight: MentionHighlightLike | null;
};

export function getEntityMentionSource<T extends EntityMentionLike>(
  mention: T
): MentionSourceLike | null {
  return mention.source ?? mention.highlight?.source ?? null;
}

export function getEntityMentionSnippet<T extends EntityMentionLike>(
  mention: T,
  maxLength = 220
): string | null {
  return buildContextSnippet(
    mention.context_snippet ?? mention.highlight?.quote_text,
    maxLength
  );
}

export function buildEntityMentionHref<T extends EntityMentionLike>(
  dossierId: string,
  mention: T
): string | null {
  const source = getEntityMentionSource(mention);

  if (!source) {
    return null;
  }

  const baseHref = `/dossiers/${dossierId}/sources/${source.id}`;

  if (!mention.highlight_id) {
    return `${baseHref}#source-context`;
  }

  const searchParams = new URLSearchParams({ highlight: mention.highlight_id });
  return `${baseHref}?${searchParams.toString()}#source-context`;
}

function getCapturedAtValue(value: Date | string | null | undefined) {
  if (!value) {
    return 0;
  }

  return new Date(value).getTime();
}

export function sortEntityMentions<T extends EntityMentionLike>(
  mentions: T[]
): T[] {
  return [...mentions].sort((a, b) => {
    const sourceTimeDifference =
      getCapturedAtValue(getEntityMentionSource(b)?.captured_at) -
      getCapturedAtValue(getEntityMentionSource(a)?.captured_at);

    if (sourceTimeDifference !== 0) {
      return sourceTimeDifference;
    }

    const sourceTitleDifference = (
      getEntityMentionSource(a)?.title ?? ""
    ).localeCompare(getEntityMentionSource(b)?.title ?? "");

    if (sourceTitleDifference !== 0) {
      return sourceTitleDifference;
    }

    if (a.highlight_id && !b.highlight_id) {
      return -1;
    }

    if (!a.highlight_id && b.highlight_id) {
      return 1;
    }

    return a.id.localeCompare(b.id);
  });
}
