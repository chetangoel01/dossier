import { describe, it, expect } from "vitest";
import { validateUrlForFetch } from "../ssrf";

describe("validateUrlForFetch", () => {
  it("rejects non-http protocols", async () => {
    const result = await validateUrlForFetch("ftp://example.com/file");
    expect(result).toEqual({ safe: false, reason: "Only http and https URLs are allowed" });
  });

  it("rejects file:// protocol", async () => {
    const result = await validateUrlForFetch("file:///etc/passwd");
    expect(result).toEqual({ safe: false, reason: "Only http and https URLs are allowed" });
  });

  it("rejects loopback IP 127.0.0.1", async () => {
    const result = await validateUrlForFetch("http://127.0.0.1/admin");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects loopback IP 127.0.0.2", async () => {
    const result = await validateUrlForFetch("http://127.0.0.2/");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects link-local 169.254.x.x", async () => {
    const result = await validateUrlForFetch("http://169.254.169.254/metadata");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects private range 10.x.x.x", async () => {
    const result = await validateUrlForFetch("http://10.0.0.1/");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects private range 172.16.x.x", async () => {
    const result = await validateUrlForFetch("http://172.16.0.1/");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects private range 192.168.x.x", async () => {
    const result = await validateUrlForFetch("http://192.168.1.1/");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects 0.0.0.0", async () => {
    const result = await validateUrlForFetch("http://0.0.0.0/");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects localhost by DNS resolution", async () => {
    const result = await validateUrlForFetch("http://localhost/");
    expect(result).toEqual({ safe: false, reason: "URL resolves to a blocked address" });
  });

  it("rejects invalid URLs", async () => {
    const result = await validateUrlForFetch("not-a-url");
    expect(result).toEqual({ safe: false, reason: "Invalid URL" });
  });

  it("allows valid public URLs", async () => {
    const result = await validateUrlForFetch("https://93.184.216.34");
    expect(result).toEqual({ safe: true });
  });

  it("allows 172.32.x.x (outside private range)", async () => {
    const result = await validateUrlForFetch("http://172.32.0.1/");
    expect(result).toEqual({ safe: true });
  });
});
