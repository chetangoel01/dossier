import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Trigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
  Content: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Item: ({
    children,
    onSelect,
  }: {
    children: ReactNode;
    onSelect?: () => void;
  }) => <button onClick={onSelect}>{children}</button>,
}));

import { SourceStatusMenu } from "./SourceStatusMenu";

describe("SourceStatusMenu", () => {
  it("hides the current status and sends the selected next status", async () => {
    const onStatusChange = vi.fn();

    render(
      <SourceStatusMenu
        sourceId="source-1"
        currentStatus="reviewing"
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.queryByText("Mark reviewing")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Mark reviewed"));

    expect(onStatusChange).toHaveBeenCalledWith("source-1", "reviewed");
  });
});
