import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { LIMITS } from "@/lib/validation";
import {
  SEARCH_OBJECT_TYPES,
  searchWorkspace,
  type SearchObjectType,
} from "@/server/queries/search";

const VALID_TYPES = new Set<SearchObjectType>(SEARCH_OBJECT_TYPES);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const dossierId = searchParams.get("dossierId")?.trim() || null;
  const typesParam = searchParams.get("types")?.trim();

  if (query.length > LIMITS.searchQuery) {
    return NextResponse.json(
      { error: `Query must be under ${LIMITS.searchQuery} characters.` },
      { status: 400 },
    );
  }

  const types = typesParam
    ? typesParam
        .split(",")
        .map((t) => t.trim())
        .filter((t): t is SearchObjectType =>
          VALID_TYPES.has(t as SearchObjectType),
        )
    : undefined;

  try {
    const results = await searchWorkspace(session.user.id, query, {
      dossierId,
      types,
    });
    return NextResponse.json(results);
  } catch {
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 },
    );
  }
}
