"use server";

import { auth } from "@/auth";
import { buildContextSnippet } from "@/lib/entities";
import { db } from "@/lib/db";
import { LIMITS, overLimit } from "@/lib/validation";
import {
  getEntityBacklink,
  type EntityBacklinkItem,
} from "@/server/queries/entities";
import { revalidatePath } from "next/cache";
import type { EntityType } from "@prisma/client";

const VALID_ENTITY_TYPES: EntityType[] = [
  "person",
  "company",
  "product",
  "location",
  "institution",
  "topic",
];

interface CreateEntityInput {
  dossierId: string;
  name: string;
  type: EntityType;
  description?: string | null;
  aliases?: string[];
  importance?: number | null;
}

interface UpdateEntityInput {
  id: string;
  name?: string;
  type?: EntityType;
  description?: string | null;
  aliases?: string[];
  importance?: number | null;
}

interface LinkEntityInput {
  entityId: string;
  sourceId?: string;
  highlightId?: string;
  claimId?: string;
  contextSnippet?: string | null;
}

function isValidImportance(value: number | null | undefined): boolean {
  return value == null || (value >= 0 && value <= 100);
}

function validateEntityFieldLengths(
  input: Partial<Pick<CreateEntityInput, "name" | "description" | "aliases">>,
): string | null {
  if (overLimit(input.name, LIMITS.entityName))
    return `Name must be under ${LIMITS.entityName} characters.`;
  if (overLimit(input.description, LIMITS.entityDescription))
    return `Description must be under ${LIMITS.entityDescription} characters.`;
  if (input.aliases) {
    if (input.aliases.length > LIMITS.entityAliasCount)
      return `No more than ${LIMITS.entityAliasCount} aliases are supported.`;
    for (const alias of input.aliases) {
      if (alias.length > LIMITS.entityAlias) {
        return `Each alias must be under ${LIMITS.entityAlias} characters.`;
      }
    }
  }
  return null;
}

function getTargetCount(input: LinkEntityInput): number {
  return [input.sourceId, input.highlightId, input.claimId].filter(Boolean)
    .length;
}

function revalidateDossierPaths(dossierId: string) {
  revalidatePath(`/dossiers/${dossierId}`, "layout");
}

export async function getEntityBacklinkDetail(input: {
  dossierId: string;
  entityId: string;
}): Promise<{ error: string } | { entity: EntityBacklinkItem }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  if (!input.dossierId) return { error: "Dossier ID is required." };
  if (!input.entityId) return { error: "Entity ID is required." };

  const entity = await getEntityBacklink(
    input.dossierId,
    input.entityId,
    session.user.id,
  );
  if (!entity) return { error: "Entity not found." };

  return { entity };
}

export async function createEntity(
  input: CreateEntityInput,
): Promise<{ error: string } | { id: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.dossierId) return { error: "Dossier ID is required." };
  if (!input.name?.trim()) return { error: "Entity name is required." };
  if (!VALID_ENTITY_TYPES.includes(input.type))
    return {
      error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(", ")}.`,
    };
  if (!isValidImportance(input.importance))
    return { error: "Importance must be between 0 and 100." };
  const lengthError = validateEntityFieldLengths(input);
  if (lengthError) return { error: lengthError };

  const dossier = await db.dossier.findFirst({
    where: { id: input.dossierId, owner_id: session.user.id },
    select: { id: true },
  });
  if (!dossier) return { error: "Dossier not found." };

  try {
    const entity = await db.entity.create({
      data: {
        dossier_id: input.dossierId,
        name: input.name.trim(),
        type: input.type,
        description: input.description?.trim() || null,
        aliases: input.aliases?.filter(Boolean) ?? [],
        importance: input.importance ?? null,
      },
      select: { id: true },
    });

    revalidateDossierPaths(input.dossierId);
    return { id: entity.id };
  } catch {
    return { error: "Failed to create entity. Please try again." };
  }
}

export async function updateEntity(
  input: UpdateEntityInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.id) return { error: "Entity ID is required." };
  if (input.name !== undefined && !input.name.trim())
    return { error: "Entity name cannot be empty." };
  if (input.type && !VALID_ENTITY_TYPES.includes(input.type))
    return {
      error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(", ")}.`,
    };
  if (!isValidImportance(input.importance))
    return { error: "Importance must be between 0 and 100." };
  const lengthError = validateEntityFieldLengths(input);
  if (lengthError) return { error: lengthError };

  const entity = await db.entity.findFirst({
    where: {
      id: input.id,
      dossier: { owner_id: session.user.id },
    },
    select: { id: true, dossier_id: true },
  });
  if (!entity) return { error: "Entity not found." };

  try {
    await db.entity.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.description !== undefined && {
          description: input.description?.trim() || null,
        }),
        ...(input.aliases !== undefined && {
          aliases: input.aliases.filter(Boolean),
        }),
        ...(input.importance !== undefined && {
          importance: input.importance,
        }),
      },
    });

    revalidateDossierPaths(entity.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to update entity. Please try again." };
  }
}

export async function deleteEntity(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const entity = await db.entity.findFirst({
    where: {
      id,
      dossier: { owner_id: session.user.id },
    },
    select: { id: true, dossier_id: true },
  });
  if (!entity) return { error: "Entity not found." };

  try {
    await db.entity.delete({ where: { id } });

    revalidateDossierPaths(entity.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to delete entity. Please try again." };
  }
}

export async function linkEntity(
  input: LinkEntityInput,
): Promise<{ error: string } | { success: true }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  if (!input.entityId) return { error: "Entity ID is required." };
  if (getTargetCount(input) !== 1)
    return { error: "Linking requires exactly one target." };

  const entity = await db.entity.findFirst({
    where: {
      id: input.entityId,
      dossier: { owner_id: session.user.id },
    },
    select: { id: true, dossier_id: true },
  });
  if (!entity) return { error: "Entity not found." };

  if (input.claimId) {
    const claim = await db.claim.findFirst({
      where: {
        id: input.claimId,
        dossier: { owner_id: session.user.id },
      },
      select: { id: true, dossier_id: true },
    });
    if (!claim || claim.dossier_id !== entity.dossier_id) {
      return { error: "Claim not found in this dossier." };
    }

    try {
      await db.claimEntity.upsert({
        where: {
          claim_id_entity_id: {
            claim_id: claim.id,
            entity_id: entity.id,
          },
        },
        update: {},
        create: {
          claim_id: claim.id,
          entity_id: entity.id,
        },
      });

      revalidateDossierPaths(claim.dossier_id);
      return { success: true };
    } catch {
      return { error: "Failed to link entity. Please try again." };
    }
  }

  if (input.sourceId) {
    const source = await db.source.findFirst({
      where: {
        id: input.sourceId,
        dossier: { owner_id: session.user.id },
      },
      select: {
        id: true,
        dossier_id: true,
        summary: true,
        raw_text: true,
        title: true,
      },
    });
    if (!source || source.dossier_id !== entity.dossier_id) {
      return { error: "Source not found in this dossier." };
    }

    try {
      const existing = await db.mention.findFirst({
        where: {
          entity_id: entity.id,
          source_id: source.id,
          highlight_id: null,
        },
        select: { id: true },
      });

      if (!existing) {
        await db.mention.create({
          data: {
            entity_id: entity.id,
            source_id: source.id,
            context_snippet: buildContextSnippet(
              input.contextSnippet ?? source.summary ?? source.raw_text ?? source.title,
            ),
          },
        });
      }

      revalidateDossierPaths(source.dossier_id);
      return { success: true };
    } catch {
      return { error: "Failed to link entity. Please try again." };
    }
  }

  const highlight = await db.highlight.findFirst({
    where: {
      id: input.highlightId,
      source: { dossier: { owner_id: session.user.id } },
    },
    select: {
      id: true,
      quote_text: true,
      source: { select: { dossier_id: true } },
    },
  });

  if (!highlight || highlight.source.dossier_id !== entity.dossier_id) {
    return { error: "Highlight not found in this dossier." };
  }

  try {
    const existing = await db.mention.findFirst({
      where: {
        entity_id: entity.id,
        source_id: null,
        highlight_id: highlight.id,
      },
      select: { id: true },
    });

    if (!existing) {
      await db.mention.create({
        data: {
          entity_id: entity.id,
          highlight_id: highlight.id,
          context_snippet: buildContextSnippet(
            input.contextSnippet ?? highlight.quote_text,
          ),
        },
      });
    }

    revalidateDossierPaths(highlight.source.dossier_id);
    return { success: true };
  } catch {
    return { error: "Failed to link entity. Please try again." };
  }
}
