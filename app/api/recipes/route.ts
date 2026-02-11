import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { saveImageFile } from "@/lib/file-storage";
import { buildSearchableText, parseIngredients } from "@/lib/recipe-text";

export const runtime = "nodejs";

const createRecipeSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  description: z.string().trim().optional(),
  ingredients: z.array(z.string().trim().min(1)).min(1, "Add at least one ingredient"),
  instructions: z.string().trim().min(10, "Add cooking steps"),
  imageUrl: z.string().trim().optional(),
});

function normalizeOptional(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.trim() || null;
}

async function parseRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      ingredients?: string[];
      instructions?: string;
      imageUrl?: string;
    };

    const parsed = createRecipeSchema.parse({
      title: body.title ?? "",
      description: body.description,
      ingredients: (body.ingredients ?? []).map((item) => item.trim()),
      instructions: body.instructions ?? "",
      imageUrl: body.imageUrl,
    });

    return {
      ...parsed,
      imageUrl: normalizeOptional(parsed.imageUrl),
      description: normalizeOptional(parsed.description),
    };
  }

  const formData = await request.formData();
  const rawImage = formData.get("image");
  const image = rawImage instanceof File && rawImage.size > 0 ? rawImage : null;
  const imageUrl = image ? await saveImageFile(image) : null;

  const parsed = createRecipeSchema.parse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    ingredients: parseIngredients(String(formData.get("ingredients") ?? "")),
    instructions: String(formData.get("instructions") ?? ""),
    imageUrl,
  });

  return {
    ...parsed,
    imageUrl: normalizeOptional(parsed.imageUrl),
    description: normalizeOptional(parsed.description),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase();

  const recipes = await prisma.recipe.findMany({
    where: query
      ? {
          searchableText: {
            contains: query,
          },
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return NextResponse.json({ recipes });
}

export async function POST(request: Request) {
  try {
    const parsed = await parseRequest(request);

    const recipe = await prisma.recipe.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        imageUrl: parsed.imageUrl,
        source: "LOCAL",
        searchableText: buildSearchableText({
          title: parsed.title,
          description: parsed.description,
          ingredients: parsed.ingredients,
          instructions: parsed.instructions,
        }),
      },
    });

    return NextResponse.json({ recipe }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid recipe input",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Could not create recipe",
      },
      { status: 500 }
    );
  }
}
