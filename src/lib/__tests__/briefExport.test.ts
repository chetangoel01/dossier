import { describe, expect, it } from "vitest";
import {
  buildExportFilename,
  renderBriefBlocks,
  renderBriefBodyPlain,
  renderBriefCitedSources,
  renderBriefMarkdown,
  type ExportSource,
} from "../briefExport";

const sourceA: ExportSource = {
  id: "srcA",
  title: "Q3 Earnings Report",
  author: "Jane Doe",
  publisher: "Example Corp",
  highlights: [
    {
      id: "h1",
      source_id: "srcA",
      page_number: 12,
      start_offset: 0,
      quote_text: "Revenue dropped 12% QoQ.",
    },
    {
      id: "h2",
      source_id: "srcA",
      page_number: null,
      start_offset: 1200,
      quote_text: "Margins remained stable.",
    },
  ],
};

const sourceB: ExportSource = {
  id: "srcB",
  title: "Analyst Memo",
  author: null,
  publisher: null,
  highlights: [],
};

const evidence = [sourceA, sourceB];

describe("renderBriefBodyPlain", () => {
  it("replaces highlight markers with '[Source, p.X]' style references", () => {
    const body = "Revenue fell [[cite:highlight:h1]] this quarter.";
    expect(renderBriefBodyPlain(body, evidence)).toBe(
      "Revenue fell [Q3 Earnings Report, p.12] this quarter.",
    );
  });

  it("uses paragraph anchor when highlight has no page number", () => {
    const body = "A note: [[cite:highlight:h2]].";
    expect(renderBriefBodyPlain(body, evidence)).toBe(
      "A note: [Q3 Earnings Report, ¶4].",
    );
  });

  it("replaces source markers with '[Source]' references", () => {
    const body = "Per the analyst [[cite:source:srcB]], risk is low.";
    expect(renderBriefBodyPlain(body, evidence)).toBe(
      "Per the analyst [Analyst Memo], risk is low.",
    );
  });

  it("emits '[missing citation]' when a reference can't be resolved", () => {
    const body = "Ghost [[cite:highlight:unknown]].";
    expect(renderBriefBodyPlain(body, evidence)).toBe(
      "Ghost [missing citation].",
    );
  });

  it("returns the body unchanged when it contains no citations", () => {
    expect(renderBriefBodyPlain("Plain prose.", evidence)).toBe("Plain prose.");
  });
});

describe("renderBriefMarkdown", () => {
  it("emits title, body and a deduped Sources section", () => {
    const markdown = renderBriefMarkdown(
      {
        title: "Risk Memo",
        body_markdown:
          "## Summary\n\nRevenue fell [[cite:highlight:h1]] while margins held [[cite:highlight:h2]].\n\nSee the [[cite:source:srcB]] for context.",
      },
      evidence,
    );

    expect(markdown).toContain("# Risk Memo");
    expect(markdown).toContain(
      "Revenue fell [Q3 Earnings Report, p.12] while margins held [Q3 Earnings Report, ¶4].",
    );
    expect(markdown).toContain("See the [Analyst Memo] for context.");
    expect(markdown).toContain("## Sources");
    expect(markdown).toContain("1. Q3 Earnings Report — Jane Doe, Example Corp");
    expect(markdown).toContain("2. Analyst Memo");
    // Sources section dedupes: h1 and h2 both reference srcA → one entry.
    const sourcesSection = markdown.split("## Sources\n\n")[1] ?? "";
    expect(sourcesSection.match(/Q3 Earnings Report/g)?.length).toBe(1);
  });

  it("omits the Sources section when the brief has no citations", () => {
    const markdown = renderBriefMarkdown(
      { title: "Empty brief", body_markdown: "Just prose, no evidence." },
      evidence,
    );
    expect(markdown).toBe("# Empty brief\n\nJust prose, no evidence.\n");
    expect(markdown).not.toContain("## Sources");
  });

  it("falls back to 'Untitled brief' when the title is blank", () => {
    const markdown = renderBriefMarkdown(
      { title: "   ", body_markdown: null },
      [],
    );
    expect(markdown).toBe("# Untitled brief\n");
  });
});

describe("renderBriefCitedSources", () => {
  it("preserves first-appearance order and dedupes", () => {
    const body =
      "Claim [[cite:source:srcB]] and [[cite:highlight:h1]] and again [[cite:source:srcB]].";
    const cited = renderBriefCitedSources(body, evidence);
    expect(cited.map((s) => s.id)).toEqual(["srcB", "srcA"]);
  });
});

describe("renderBriefBlocks", () => {
  it("splits the body into heading and paragraph blocks with inline citations", () => {
    const body =
      "## Summary\n\nRevenue fell [[cite:highlight:h1]].\n\nSecond paragraph.";
    const blocks = renderBriefBlocks(body, evidence);
    expect(blocks).toHaveLength(3);
    expect(blocks[0].type).toBe("heading");
    expect(blocks[0].depth).toBe(2);
    expect(blocks[1].type).toBe("paragraph");
    const paragraph = blocks[1].nodes;
    expect(paragraph[0]).toEqual({ type: "text", text: "Revenue fell " });
    expect(paragraph[1]).toEqual({
      type: "citation",
      text: "[Q3 Earnings Report, p.12]",
      resolved: true,
    });
  });

  it("flags missing citations so the print page can style them", () => {
    const blocks = renderBriefBlocks(
      "Note [[cite:source:ghost]].",
      evidence,
    );
    const citation = blocks[0].nodes.find((n) => n.type === "citation");
    expect(citation).toEqual({
      type: "citation",
      text: "[missing citation]",
      resolved: false,
    });
  });
});

describe("buildExportFilename", () => {
  it("slugifies the brief title", () => {
    expect(buildExportFilename("Q3 Risk Memo", "md")).toBe("q3-risk-memo.md");
  });

  it("strips punctuation and collapses separators", () => {
    expect(buildExportFilename("U.S. / Global — Strategy!", "pdf")).toBe(
      "u-s-global-strategy.pdf",
    );
  });

  it("falls back to 'brief' when nothing remains", () => {
    expect(buildExportFilename("   ", "md")).toBe("brief.md");
    expect(buildExportFilename("!!!", "md")).toBe("brief.md");
  });
});
