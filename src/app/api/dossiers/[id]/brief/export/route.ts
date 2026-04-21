import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  buildExportFilename,
  renderBriefMarkdown,
} from "@/lib/briefExport";
import { getBriefEvidence, getOrCreateBrief } from "@/server/queries/briefs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let brief, evidence;
  try {
    [brief, evidence] = await Promise.all([
      getOrCreateBrief(id, session.user.id),
      getBriefEvidence(id, session.user.id),
    ]);
  } catch {
    return NextResponse.json(
      { error: "Failed to load brief. Please try again." },
      { status: 500 },
    );
  }

  if (!brief) {
    return NextResponse.json({ error: "Brief not found." }, { status: 404 });
  }

  const markdown = renderBriefMarkdown(
    { title: brief.title, body_markdown: brief.body_markdown },
    evidence,
  );
  const filename = buildExportFilename(brief.title, "md");

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
