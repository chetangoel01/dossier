import { describe, expect, it } from "vitest";
import {
  buildCitationHref,
  buildCitationToken,
  formatHighlightAnchor,
  formatSourceShortCode,
  segmentCitations,
} from "../citations";

describe("citations", () => {
  describe("buildCitationToken", () => {
    it("formats highlight and source refs as inline markers", () => {
      expect(buildCitationToken({ kind: "highlight", id: "abc123" })).toBe(
        "[[cite:highlight:abc123]]",
      );
      expect(buildCitationToken({ kind: "source", id: "xyz_9" })).toBe(
        "[[cite:source:xyz_9]]",
      );
    });
  });

  describe("segmentCitations", () => {
    it("returns a single empty text segment for empty input", () => {
      expect(segmentCitations("")).toEqual([{ type: "text", text: "" }]);
    });

    it("splits body text around citation tokens in order", () => {
      const body =
        "Revenue fell 12% [[cite:highlight:h1]] and margins held [[cite:source:s1]].";
      const segments = segmentCitations(body);

      expect(segments).toEqual([
        { type: "text", text: "Revenue fell 12% " },
        {
          type: "citation",
          raw: "[[cite:highlight:h1]]",
          ref: { kind: "highlight", id: "h1" },
        },
        { type: "text", text: " and margins held " },
        {
          type: "citation",
          raw: "[[cite:source:s1]]",
          ref: { kind: "source", id: "s1" },
        },
        { type: "text", text: "." },
      ]);
    });

    it("handles adjacent citation tokens and leading/trailing text", () => {
      const body = "[[cite:highlight:a]][[cite:source:b]] tail";
      const segments = segmentCitations(body);

      expect(segments).toEqual([
        {
          type: "citation",
          raw: "[[cite:highlight:a]]",
          ref: { kind: "highlight", id: "a" },
        },
        {
          type: "citation",
          raw: "[[cite:source:b]]",
          ref: { kind: "source", id: "b" },
        },
        { type: "text", text: " tail" },
      ]);
    });

    it("ignores malformed markers", () => {
      const body = "Random [cite:foo] text [[cite:bogus:x]] end";
      const segments = segmentCitations(body);

      expect(segments).toEqual([
        { type: "text", text: "Random [cite:foo] text [[cite:bogus:x]] end" },
      ]);
    });

    it("does not share regex state across calls", () => {
      const body = "prefix [[cite:source:a]] suffix";
      const first = segmentCitations(body);
      const second = segmentCitations(body);
      expect(first).toEqual(second);
    });
  });

  describe("formatSourceShortCode", () => {
    it("uses two-word initials when available", () => {
      expect(
        formatSourceShortCode({ id: "cuid123", title: "Quarterly Report" }),
      ).toBe("QR");
    });

    it("falls back to 3-letter slice for single words", () => {
      expect(
        formatSourceShortCode({ id: "cuid123", title: "Memo" }),
      ).toBe("MEM");
    });

    it("falls back to trailing id characters when title is empty", () => {
      expect(
        formatSourceShortCode({ id: "abcdefghij", title: "" }),
      ).toBe("GHIJ");
      expect(
        formatSourceShortCode({ id: "abcdefghij", title: null }),
      ).toBe("GHIJ");
    });

    it("strips punctuation so 'U.S. Strategy' becomes US", () => {
      expect(
        formatSourceShortCode({ id: "cuid1", title: "U.S. Strategy" }),
      ).toBe("US");
    });
  });

  describe("formatHighlightAnchor", () => {
    it("uses page numbers when present", () => {
      expect(
        formatHighlightAnchor({
          page_number: 7,
          start_offset: 10_000,
        }),
      ).toBe("p.7");
    });

    it("approximates paragraph number from offset when page is missing", () => {
      expect(
        formatHighlightAnchor({
          page_number: null,
          start_offset: 0,
        }),
      ).toBe("¶1");
      expect(
        formatHighlightAnchor({
          page_number: null,
          start_offset: 1200,
        }),
      ).toBe("¶4");
    });
  });

  describe("buildCitationHref", () => {
    it("points source citations at the reader hash anchor", () => {
      expect(
        buildCitationHref("dos1", { kind: "source", id: "src1" }),
      ).toBe("/dossiers/dos1/sources/src1#source-context");
    });

    it("points highlight citations at the source reader with highlight param", () => {
      expect(
        buildCitationHref(
          "dos1",
          { kind: "highlight", id: "h1" },
          { highlightSourceId: "src1" },
        ),
      ).toBe(
        "/dossiers/dos1/sources/src1?highlight=h1#source-context",
      );
    });

    it("returns null when the highlight's source is unknown", () => {
      expect(
        buildCitationHref("dos1", { kind: "highlight", id: "h1" }),
      ).toBeNull();
    });
  });
});
