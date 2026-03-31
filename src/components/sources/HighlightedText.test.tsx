import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HighlightedText } from "./HighlightedText";

describe("HighlightedText", () => {
  it("renders plain text when there are no highlights", () => {
    render(<HighlightedText text="Analyst brief" highlights={[]} />);

    expect(screen.getByText("Analyst brief")).toBeInTheDocument();
    expect(screen.queryByText("Analyst brief")?.tagName).toBe("SPAN");
  });

  it("renders highlight segments and truncates overlaps to non-overlapping tails", () => {
    render(
      <HighlightedText
        text="abcdefghi"
        highlights={[
          { id: "one", start_offset: 1, end_offset: 5, label: "evidence" },
          { id: "two", start_offset: 3, end_offset: 8, label: "quote" },
        ]}
      />,
    );

    const firstMark = screen.getByText("bcde");
    const secondMark = screen.getByText("fgh");

    expect(firstMark).toHaveAttribute("data-highlight-id", "one");
    expect(secondMark).toHaveAttribute("data-highlight-id", "two");
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("i")).toBeInTheDocument();
  });
});
