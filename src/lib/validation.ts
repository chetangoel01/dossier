// Shared field-length limits for server-side validation. Values match the
// intent of user-entered text (short identifier vs. long-form note) and
// guard against runaway inputs causing DB errors or UI damage.

export const LIMITS = {
  dossierTitle: 200,
  dossierSummary: 1_000,
  dossierResearchGoal: 500,
  sourceTitle: 300,
  sourceAuthor: 200,
  sourcePublisher: 200,
  sourceSummary: 2_000,
  sourceUrl: 2_000,
  sourceRawText: 1_000_000,
  claimStatement: 1_000,
  claimNotes: 5_000,
  entityName: 200,
  entityDescription: 2_000,
  entityAlias: 200,
  entityAliasCount: 20,
  eventTitle: 300,
  eventDescription: 2_000,
  highlightQuote: 10_000,
  highlightAnnotation: 2_000,
  briefTitle: 200,
  briefBody: 200_000,
  searchQuery: 200,
} as const;

export function overLimit(
  value: string | null | undefined,
  max: number,
): boolean {
  return !!value && value.length > max;
}
