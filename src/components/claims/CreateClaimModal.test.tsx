import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockRouterRefresh,
  mockUseRouter,
  resetTestMocks,
} from "@/test/mocks";

const { mockCreateClaim } = vi.hoisted(() => ({
  mockCreateClaim: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: mockUseRouter }));
vi.mock("@/server/actions/claims", () => ({ createClaim: mockCreateClaim }));

import { CreateClaimModal } from "./CreateClaimModal";

describe("CreateClaimModal", () => {
  beforeEach(() => {
    cleanup();
    resetTestMocks();
    mockCreateClaim.mockReset();
    mockCreateClaim.mockResolvedValue({ id: "claim-1" });
  });

  const highlights = [
    { id: "hl-1", quote_text: "First quote", label: "evidence" },
    { id: "hl-2", quote_text: "Second quote", label: "question" },
  ];

  it("submits the selected highlights and numeric confidence", async () => {
    const onClose = vi.fn();

    render(
      <CreateClaimModal
        dossierId="dos-1"
        highlights={highlights}
        preselectedHighlightIds={["hl-1"]}
        open
        onClose={onClose}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "A clear, defensible assertion drawn from evidence...",
      ),
      {
      target: { value: "This evidence supports the claim." },
      },
    );
    fireEvent.change(screen.getByPlaceholderText("—"), {
      target: { value: "75" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Optional context or reasoning..."),
      {
      target: { value: "Supporting context" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /second quote/i }));
    fireEvent.submit(screen.getByRole("button", { name: "Create Claim" }).closest("form")!);

    await waitFor(() => {
      expect(mockCreateClaim).toHaveBeenCalledWith({
        dossierId: "dos-1",
        statement: "This evidence supports the claim.",
        status: "open",
        confidence: 75,
        notes: "Supporting context",
        highlightIds: ["hl-1", "hl-2"],
      });
    });
    expect(mockRouterRefresh).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows action errors without closing the modal", async () => {
    const onClose = vi.fn();
    mockCreateClaim.mockResolvedValue({ error: "At least one highlight is required." });

    render(
      <CreateClaimModal dossierId="dos-1" highlights={highlights} open onClose={onClose} />,
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "A clear, defensible assertion drawn from evidence...",
      ),
      {
      target: { value: "This evidence supports the claim." },
      },
    );
    fireEvent.submit(screen.getByRole("button", { name: "Create Claim" }).closest("form")!);

    expect(
      await screen.findByText("At least one highlight is required."),
    ).toBeInTheDocument();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
