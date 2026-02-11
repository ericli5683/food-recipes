import OpenAI from "openai";
import { NextResponse } from "next/server";

import { saveImageFile } from "@/lib/file-storage";
import { searchOnlineRecipes } from "@/lib/mealdb";

export const runtime = "nodejs";

function cleanDishName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");
}

async function detectDishName(file: File): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for image recipe discovery.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const mimeType = file.type || "image/jpeg";
  const encodedImage = Buffer.from(await file.arrayBuffer()).toString("base64");

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Identify the main dish in this food photo. Return only the food name in 1 to 4 words.",
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${encodedImage}`,
            detail: "auto",
          },
        ],
      },
    ],
    max_output_tokens: 24,
  });

  return cleanDishName(response.output_text ?? "");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageInput = formData.get("image");

    if (!(imageInput instanceof File) || imageInput.size === 0) {
      return NextResponse.json(
        {
          error: "Attach an image file.",
        },
        { status: 400 }
      );
    }

    const uploadedImageUrl = await saveImageFile(imageInput);
    const detectedFood = await detectDishName(imageInput);

    if (!detectedFood) {
      return NextResponse.json(
        {
          error: "Could not identify a dish from that photo. Try a clearer image.",
        },
        { status: 422 }
      );
    }

    const recipes = await searchOnlineRecipes(detectedFood);

    return NextResponse.json({
      query: detectedFood,
      uploadedImageUrl,
      recipes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not discover recipes from this image.";
    const status = message.includes("OPENAI_API_KEY") ? 400 : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}
