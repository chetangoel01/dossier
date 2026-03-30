import { describe, expect, it } from "vitest";
import {
  buildEntityMentionHref,
  buildContextSnippet,
  dedupeById,
  getEntityMentionSnippet,
  getEntityMentionSource,
  parseEntityAliases,
  sortEntityMentions,
} from "@/lib/entities";

describe("parseEntityAliases", () => {
  it("splits aliases on commas and newlines", () => {
    expect(parseEntityAliases("Acme, ACME Corp\nAcme Corporation")).toEqual([
      "Acme",
      "ACME Corp",
      "Acme Corporation",
    ]);
  });

  it("drops blanks and duplicate values", () => {
    expect(parseEntityAliases("  Acme ,, \nAcme\n")).toEqual(["Acme"]);
  });
});

describe("buildContextSnippet", () => {
  it("normalizes whitespace", () => {
    expect(buildContextSnippet("  one   two\nthree  ")).toBe("one two three");
  });

  it("truncates long values with an ellipsis", () => {
    expect(buildContextSnippet("abcdefghij", 8)).toBe("abcdefg…");
  });
});

describe("dedupeById", () => {
  it("keeps the first occurrence of each id", () => {
    expect(
      dedupeById([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
        { id: "1", name: "Duplicate" },
      ])
    ).toEqual([
      { id: "1", name: "First" },
      { id: "2", name: "Second" },
    ]);
  });
});

describe("entity mention backlinks", () => {
  const newerSource = {
    id: "source-newer",
    title: "Newer Source",
    captured_at: new Date("2026-03-02T12:00:00Z"),
  };

  const olderSource = {
    id: "source-older",
    title: "Older Source",
    captured_at: new Date("2026-02-20T12:00:00Z"),
  };

  it("prefers an explicit source and falls back to the highlight source", () => {
    expect(
      getEntityMentionSource({
        id: "mention-source",
        source_id: newerSource.id,
        highlight_id: null,
        context_snippet: "Explicit source mention",
        source: newerSource,
        highlight: null,
      })
    ).toEqual(newerSource);

    expect(
      getEntityMentionSource({
        id: "mention-highlight",
        source_id: null,
        highlight_id: "highlight-1",
        context_snippet: null,
        source: null,
        highlight: {
          id: "highlight-1",
          quote_text: "Fallback quote text",
          source: olderSource,
        },
      })
    ).toEqual(olderSource);
  });

  it("builds source and highlight hrefs back into evidence", () => {
    expect(
      buildEntityMentionHref("dossier-1", {
        id: "mention-source",
        source_id: newerSource.id,
        highlight_id: null,
        context_snippet: "Explicit source mention",
        source: newerSource,
        highlight: null,
      })
    ).toBe("/dossiers/dossier-1/sources/source-newer#source-context");

    expect(
      buildEntityMentionHref("dossier-1", {
        id: "mention-highlight",
        source_id: newerSource.id,
        highlight_id: "highlight-1",
        context_snippet: "Highlighted source mention",
        source: newerSource,
        highlight: {
          id: "highlight-1",
          quote_text: "Quoted evidence",
          source: newerSource,
        },
      })
    ).toBe(
      "/dossiers/dossier-1/sources/source-newer?highlight=highlight-1#source-context"
    );
  });

  it("uses the highlight quote as a snippet fallback", () => {
    expect(
      getEntityMentionSnippet({
        id: "mention-highlight",
        source_id: newerSource.id,
        highlight_id: "highlight-1",
        context_snippet: null,
        source: newerSource,
        highlight: {
          id: "highlight-1",
          quote_text: "Fallback quote text",
          source: newerSource,
        },
      })
    ).toBe("Fallback quote text");
  });

  it("sorts mentions by source recency before stable fallbacks", () => {
    const mentions = sortEntityMentions([
      {
        id: "mention-older",
        source_id: olderSource.id,
        highlight_id: null,
        context_snippet: "Older source mention",
        source: olderSource,
        highlight: null,
      },
      {
        id: "mention-newer",
        source_id: newerSource.id,
        highlight_id: "highlight-1",
        context_snippet: "Newer source mention",
        source: newerSource,
        highlight: {
          id: "highlight-1",
          quote_text: "Quoted evidence",
          source: newerSource,
        },
      },
    ]);

    expect(mentions.map((mention) => mention.id)).toEqual([
      "mention-newer",
      "mention-older",
    ]);
  });
});
