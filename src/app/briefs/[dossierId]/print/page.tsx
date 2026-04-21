import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  formatSourceAttribution,
  renderBriefBlocks,
  renderBriefCitedSources,
  type ExportSource,
  type RenderedBodyBlock,
  type RenderedInline,
} from "@/lib/briefExport";
import { getBriefEvidence, getOrCreateBrief } from "@/server/queries/briefs";
import { BriefPrintLauncher } from "@/components/briefs/BriefPrintLauncher";
import "./print.css";

export const metadata: Metadata = {
  title: "Brief — Print",
  robots: { index: false, follow: false },
};

interface PrintPageProps {
  params: Promise<{ dossierId: string }>;
}

export default async function BriefPrintPage({ params }: PrintPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { dossierId } = await params;
  const [brief, evidence] = await Promise.all([
    getOrCreateBrief(dossierId, session.user.id),
    getBriefEvidence(dossierId, session.user.id),
  ]);

  if (!brief) notFound();

  const body = brief.body_markdown ?? "";
  const blocks = renderBriefBlocks(body, evidence);
  const citedSources: ExportSource[] = renderBriefCitedSources(body, evidence);
  const title = brief.title.trim() || "Untitled brief";

  return (
    <>
      <BriefPrintLauncher />
      <div className="brief-print-root">
        <article className="brief-print-article">
          <header className="brief-print-header">
            <span className="brief-print-eyebrow">Dossier · Brief</span>
            <h1 className="brief-print-title">{title}</h1>
          </header>

          <div className="brief-print-body">
            {blocks.length === 0 ? (
              <p className="brief-print-empty">This brief is empty.</p>
            ) : (
              blocks.map((block, index) => renderBlock(block, index))
            )}
          </div>

          {citedSources.length > 0 ? (
            <section className="brief-print-sources">
              <h2 className="brief-print-sources-heading">Sources</h2>
              <ol className="brief-print-sources-list">
                {citedSources.map((source) => (
                  <li key={source.id}>{formatSourceAttribution(source)}</li>
                ))}
              </ol>
            </section>
          ) : null}
        </article>
      </div>
    </>
  );
}

function renderBlock(block: RenderedBodyBlock, index: number) {
  if (block.type === "heading") {
    const depth = Math.min(Math.max(block.depth ?? 2, 2), 6);
    const Tag = (`h${depth}` as unknown) as keyof React.JSX.IntrinsicElements;
    return (
      <Tag key={index} className={`brief-print-heading brief-print-h${depth}`}>
        {block.nodes.map((node, i) => renderInline(node, i))}
      </Tag>
    );
  }
  return (
    <p key={index} className="brief-print-paragraph">
      {block.nodes.map((node, i) => renderInline(node, i))}
    </p>
  );
}

function renderInline(node: RenderedInline, key: number) {
  if (node.type === "text") return <span key={key}>{node.text}</span>;
  return (
    <span
      key={key}
      className={
        node.resolved
          ? "brief-print-citation"
          : "brief-print-citation brief-print-citation-missing"
      }
    >
      {node.text}
    </span>
  );
}
