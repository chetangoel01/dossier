import { lookup } from "node:dns/promises";

/**
 * Check whether an IP address belongs to a blocked range:
 * - Loopback (127.0.0.0/8, ::1)
 * - Link-local (169.254.0.0/16, fe80::/10)
 * - Private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
 * - Unspecified (0.0.0.0, ::)
 */
function isBlockedIP(ip: string): boolean {
  // IPv6 loopback / unspecified
  if (ip === "::1" || ip === "::") return true;

  // IPv6 link-local (fe80::/10) and unique-local (fc00::/7)
  const lowerIp = ip.toLowerCase();
  if (lowerIp.startsWith("fe80:") || lowerIp.startsWith("fc") || lowerIp.startsWith("fd")) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:x.x.x.x) — extract and check the IPv4 part
  const ipv4 = lowerIp.startsWith("::ffff:") ? lowerIp.slice(7) : ip;
  const parts = ipv4.split(".").map(Number);

  if (parts.length !== 4 || parts.some((p) => isNaN(p))) {
    // Pure IPv6 address — if we haven't matched any blocked prefix above, allow it
    return false;
  }

  const [a, b] = parts;

  // 0.0.0.0/8 — unspecified / "this" network
  if (a === 0) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 127.0.0.0/8
  if (a === 127) return true;
  // 169.254.0.0/16
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validate a URL for SSRF safety.
 * Returns `{ safe: true }` or `{ safe: false, reason: string }`.
 */
export async function validateUrlForFetch(
  raw: string
): Promise<{ safe: true } | { safe: false; reason: string }> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { safe: false, reason: "Invalid URL" };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { safe: false, reason: "Only http and https URLs are allowed" };
  }

  // Resolve hostname to IP
  const hostname = parsed.hostname;

  // Reject bare IP literals that are blocked (skip DNS)
  const ipLiteralParts = hostname.split(".").map(Number);
  if (ipLiteralParts.length === 4 && ipLiteralParts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    if (isBlockedIP(hostname)) {
      return { safe: false, reason: "URL resolves to a blocked address" };
    }
    return { safe: true };
  }

  // DNS resolution
  try {
    const result = await lookup(hostname, { all: true });
    for (const entry of result) {
      if (isBlockedIP(entry.address)) {
        return { safe: false, reason: "URL resolves to a blocked address" };
      }
    }
  } catch {
    return { safe: false, reason: "Could not resolve hostname" };
  }

  return { safe: true };
}
