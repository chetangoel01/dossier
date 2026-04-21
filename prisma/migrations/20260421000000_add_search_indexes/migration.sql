-- Full-text search GIN indexes for global workspace search.
-- Uses the 'simple' config so proper nouns and research-specific terms
-- are matched without English-language stemming.

CREATE INDEX "dossiers_fts_idx" ON "dossiers" USING GIN (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' ||
    coalesce("summary", '') || ' ' ||
    coalesce("research_goal", '')
  )
);

CREATE INDEX "sources_fts_idx" ON "sources" USING GIN (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' ||
    coalesce("author", '') || ' ' ||
    coalesce("publisher", '') || ' ' ||
    coalesce("summary", '') || ' ' ||
    coalesce("raw_text", '')
  )
);

CREATE INDEX "highlights_fts_idx" ON "highlights" USING GIN (
  to_tsvector(
    'simple',
    coalesce("quote_text", '') || ' ' ||
    coalesce("annotation", '')
  )
);

CREATE INDEX "claims_fts_idx" ON "claims" USING GIN (
  to_tsvector(
    'simple',
    coalesce("statement", '') || ' ' ||
    coalesce("notes", '')
  )
);

CREATE INDEX "entities_fts_idx" ON "entities" USING GIN (
  to_tsvector(
    'simple',
    coalesce("name", '') || ' ' ||
    coalesce("description", '') || ' ' ||
    array_to_string("aliases", ' ')
  )
);

CREATE INDEX "briefs_fts_idx" ON "briefs" USING GIN (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' ||
    coalesce("body_markdown", '')
  )
);
