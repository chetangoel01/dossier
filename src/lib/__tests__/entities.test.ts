import { describe, expect, it } from "vitest";
import {
  buildContextSnippet,
  dedupeById,
  parseEntityAliases,
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
      ]),
    ).toEqual([
      { id: "1", name: "First" },
      { id: "2", name: "Second" },
    ]);
  });
});
