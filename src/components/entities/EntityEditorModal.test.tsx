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

const { mockCreateEntity, mockUpdateEntity } = vi.hoisted(() => ({
  mockCreateEntity: vi.fn(),
  mockUpdateEntity: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: mockUseRouter }));
vi.mock("@/server/actions/entities", () => ({
  createEntity: mockCreateEntity,
  updateEntity: mockUpdateEntity,
}));

import { EntityEditorModal } from "./EntityEditorModal";

describe("EntityEditorModal", () => {
  beforeEach(() => {
    cleanup();
    resetTestMocks();
    mockCreateEntity.mockReset();
    mockUpdateEntity.mockReset();
    mockCreateEntity.mockResolvedValue({ id: "entity-1" });
    mockUpdateEntity.mockResolvedValue({ success: true });
  });

  it("creates entities with parsed aliases", async () => {
    const onClose = vi.fn();

    render(
      <EntityEditorModal dossierId="dos-1" open onClose={onClose} />,
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Northgate Pharma" },
    });
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: "company" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Key manufacturer" },
    });
    fireEvent.change(screen.getByLabelText(/aliases/i), {
      target: { value: "Northgate\nNGP, Northgate" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Create Entity" }).closest("form")!);

    await waitFor(() => {
      expect(mockCreateEntity).toHaveBeenCalledWith({
        dossierId: "dos-1",
        name: "Northgate Pharma",
        type: "company",
        description: "Key manufacturer",
        aliases: ["Northgate", "NGP"],
      });
    });
    expect(mockRouterRefresh).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("updates an existing entity", async () => {
    const onClose = vi.fn();

    render(
      <EntityEditorModal
        dossierId="dos-1"
        entity={{
          id: "entity-1",
          name: "Northgate",
          type: "company",
          description: "Old description",
          aliases: ["NG"],
        }}
        open
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Updated description" },
    });
    expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: "Save Entity" }).closest("form")!);

    await waitFor(() => {
      expect(mockUpdateEntity).toHaveBeenCalledWith({
        id: "entity-1",
        name: "Northgate",
        type: "company",
        description: "Updated description",
        aliases: ["NG"],
      });
    });
    expect(mockRouterRefresh).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows action errors without closing the modal", async () => {
    const onClose = vi.fn();
    mockCreateEntity.mockResolvedValue({ error: "Entity already exists." });

    render(
      <EntityEditorModal dossierId="dos-1" open onClose={onClose} />,
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Northgate" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Create Entity" }).closest("form")!);

    expect(await screen.findByText("Entity already exists.")).toBeInTheDocument();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
