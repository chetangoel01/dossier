-- CreateEnum
CREATE TYPE "DossierStatus" AS ENUM ('active', 'archived', 'on_hold');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('web_link', 'pdf', 'pasted_text', 'manual_note', 'internal_memo');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('unreviewed', 'reviewing', 'reviewed', 'discarded');

-- CreateEnum
CREATE TYPE "HighlightLabel" AS ENUM ('evidence', 'question', 'counterpoint', 'stat', 'quote');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('open', 'supported', 'contested', 'deprecated');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('person', 'company', 'product', 'location', 'institution', 'topic');

-- CreateEnum
CREATE TYPE "EventPrecision" AS ENUM ('day', 'month', 'year', 'unknown');

-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('draft', 'ready', 'published');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "status" "DossierStatus" NOT NULL DEFAULT 'active',
    "research_goal" TEXT,
    "priority" INTEGER,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "author" TEXT,
    "publisher" TEXT,
    "published_at" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_text" TEXT,
    "summary" TEXT,
    "credibility_rating" INTEGER,
    "source_status" "SourceStatus" NOT NULL DEFAULT 'unreviewed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "highlights" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "quote_text" TEXT NOT NULL,
    "start_offset" INTEGER NOT NULL,
    "end_offset" INTEGER NOT NULL,
    "page_number" INTEGER,
    "annotation" TEXT,
    "label" "HighlightLabel" NOT NULL DEFAULT 'evidence',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "confidence" INTEGER,
    "status" "ClaimStatus" NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_highlights" (
    "claim_id" TEXT NOT NULL,
    "highlight_id" TEXT NOT NULL,

    CONSTRAINT "claim_highlights_pkey" PRIMARY KEY ("claim_id","highlight_id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "description" TEXT,
    "aliases" TEXT[],
    "importance" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_entities" (
    "claim_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,

    CONSTRAINT "claim_entities_pkey" PRIMARY KEY ("claim_id","entity_id")
);

-- CreateTable
CREATE TABLE "mentions" (
    "id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "source_id" TEXT,
    "highlight_id" TEXT,
    "context_snippet" TEXT,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_date" TIMESTAMP(3),
    "precision" "EventPrecision" NOT NULL DEFAULT 'unknown',
    "confidence" INTEGER,
    "claim_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_highlights" (
    "event_id" TEXT NOT NULL,
    "highlight_id" TEXT NOT NULL,

    CONSTRAINT "event_highlights_pkey" PRIMARY KEY ("event_id","highlight_id")
);

-- CreateTable
CREATE TABLE "event_entities" (
    "event_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,

    CONSTRAINT "event_entities_pkey" PRIMARY KEY ("event_id","entity_id")
);

-- CreateTable
CREATE TABLE "briefs" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body_markdown" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BriefStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_on_sources" (
    "tag_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,

    CONSTRAINT "tags_on_sources_pkey" PRIMARY KEY ("tag_id","source_id")
);

-- CreateTable
CREATE TABLE "tags_on_claims" (
    "tag_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,

    CONSTRAINT "tags_on_claims_pkey" PRIMARY KEY ("tag_id","claim_id")
);

-- CreateTable
CREATE TABLE "tags_on_entities" (
    "tag_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,

    CONSTRAINT "tags_on_entities_pkey" PRIMARY KEY ("tag_id","entity_id")
);

-- CreateTable
CREATE TABLE "tags_on_events" (
    "tag_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "tags_on_events_pkey" PRIMARY KEY ("tag_id","event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_owner_id_slug_key" ON "dossiers"("owner_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "briefs_dossier_id_key" ON "briefs"("dossier_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_highlights" ADD CONSTRAINT "claim_highlights_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_highlights" ADD CONSTRAINT "claim_highlights_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "highlights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_entities" ADD CONSTRAINT "claim_entities_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_entities" ADD CONSTRAINT "claim_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "highlights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_highlights" ADD CONSTRAINT "event_highlights_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_highlights" ADD CONSTRAINT "event_highlights_highlight_id_fkey" FOREIGN KEY ("highlight_id") REFERENCES "highlights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entities" ADD CONSTRAINT "event_entities_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entities" ADD CONSTRAINT "event_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_sources" ADD CONSTRAINT "tags_on_sources_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_sources" ADD CONSTRAINT "tags_on_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_claims" ADD CONSTRAINT "tags_on_claims_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_claims" ADD CONSTRAINT "tags_on_claims_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_entities" ADD CONSTRAINT "tags_on_entities_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_entities" ADD CONSTRAINT "tags_on_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_events" ADD CONSTRAINT "tags_on_events_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_events" ADD CONSTRAINT "tags_on_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
