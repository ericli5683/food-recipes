import { NextResponse } from "next/server";

import { searchOnlineRecipes } from "@/lib/mealdb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      {
        error: "Missing q query parameter.",
      },
      { status: 400 }
    );
  }

  try {
    const recipes = await searchOnlineRecipes(query);
    return NextResponse.json({ query, recipes });
  } catch {
    return NextResponse.json(
      {
        error: "Could not fetch online recipes right now.",
      },
      { status: 502 }
    );
  }
}
