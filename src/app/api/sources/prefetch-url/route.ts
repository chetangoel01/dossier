import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url: string;
  try {
    const body = (await req.json()) as { url?: string };
    url = body.url?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Dossier/1.0 (metadata prefetch)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ title: null });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ title: null });
    }

    // Read only the first 32KB to find the title quickly
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ title: null });
    }

    const decoder = new TextDecoder();
    let html = "";
    const maxBytes = 32 * 1024;

    while (html.length < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = match
      ? match[1].replace(/\s+/g, " ").trim()
      : null;

    return NextResponse.json({ title });
  } catch {
    // Network errors, timeouts, etc. — just return null title
    return NextResponse.json({ title: null });
  }
}
