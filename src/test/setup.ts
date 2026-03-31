import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

if (typeof HTMLDialogElement !== "undefined") {
  const dialogProto = HTMLDialogElement.prototype as HTMLDialogElement & {
    showModal?: () => void;
    close?: () => void;
  };

  if (!dialogProto.showModal) {
    dialogProto.showModal = function showModal() {
      this.open = true;
    };
  }

  if (!dialogProto.close) {
    dialogProto.close = function close() {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }
}
