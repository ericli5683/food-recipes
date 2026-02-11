"use client";

import clsx from "clsx";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";

import type { LocalRecipe, OnlineRecipe } from "@/lib/types";

type RecipesPayload = {
  recipes: LocalRecipe[];
};

type OnlineRecipesPayload = {
  query: string;
  recipes: OnlineRecipe[];
  uploadedImageUrl?: string;
};

const initialRecipeForm = {
  title: "",
  description: "",
  ingredients: "",
  instructions: "",
};

function previewInstructions(value: string | null): string {
  if (!value) {
    return "No full instructions were provided by the source.";
  }

  if (value.length <= 180) {
    return value;
  }

  return `${value.slice(0, 177)}...`;
}

export function FoodRecipesApp() {
  const [query, setQuery] = useState("");
  const [localRecipes, setLocalRecipes] = useState<LocalRecipe[]>([]);
  const [onlineRecipes, setOnlineRecipes] = useState<OnlineRecipe[]>([]);
  const [recipeForm, setRecipeForm] = useState(initialRecipeForm);
  const [recipeImage, setRecipeImage] = useState<File | null>(null);
  const [discoverImage, setDiscoverImage] = useState<File | null>(null);
  const [discoverPreviewUrl, setDiscoverPreviewUrl] = useState<string | null>(null);
  const [activeQueryLabel, setActiveQueryLabel] = useState<string>("all dishes");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [isDiscoveringFromImage, setIsDiscoveringFromImage] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();

  const fetchLocalRecipes = useCallback(async (searchTerm: string): Promise<LocalRecipe[]> => {
    const endpoint = searchTerm.trim()
      ? `/api/recipes?q=${encodeURIComponent(searchTerm.trim())}`
      : "/api/recipes";

    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = (await response.json()) as RecipesPayload & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error || "Failed to load local recipes.");
    }

    return payload.recipes;
  }, []);

  const searchEverywhere = useCallback(
    async (searchTerm: string) => {
      const normalizedQuery = searchTerm.trim();
      setErrorMessage(null);

      if (!normalizedQuery) {
        const allLocal = await fetchLocalRecipes("");
        setLocalRecipes(allLocal);
        setOnlineRecipes([]);
        setActiveQueryLabel("all dishes");
        setStatusMessage("Showing all local recipes.");
        return;
      }

      const [localResponse, onlineResponse] = await Promise.all([
        fetch(`/api/recipes?q=${encodeURIComponent(normalizedQuery)}`, {
          cache: "no-store",
        }),
        fetch(`/api/discover?q=${encodeURIComponent(normalizedQuery)}`, {
          cache: "no-store",
        }),
      ]);

      const localPayload = (await localResponse.json()) as RecipesPayload & { error?: string };
      const onlinePayload = (await onlineResponse.json()) as OnlineRecipesPayload & {
        error?: string;
      };

      if (!localResponse.ok) {
        throw new Error(localPayload.error || "Failed to load local search results.");
      }

      if (!onlineResponse.ok) {
        throw new Error(onlinePayload.error || "Failed to load online recipes.");
      }

      setLocalRecipes(localPayload.recipes);
      setOnlineRecipes(onlinePayload.recipes);
      setActiveQueryLabel(normalizedQuery);
      setStatusMessage(
        `Found ${localPayload.recipes.length} local and ${onlinePayload.recipes.length} online recipes for "${normalizedQuery}".`
      );
    },
    [fetchLocalRecipes]
  );

  useEffect(() => {
    void (async () => {
      try {
        const recipes = await fetchLocalRecipes("");
        setLocalRecipes(recipes);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load local recipes.";
        setErrorMessage(message);
      }
    })();
  }, [fetchLocalRecipes]);

  const localRecipeCount = useMemo(() => localRecipes.length, [localRecipes]);
  const onlineRecipeCount = useMemo(() => onlineRecipes.length, [onlineRecipes]);

  function updateRecipeForm<K extends keyof typeof initialRecipeForm>(
    key: K,
    value: (typeof initialRecipeForm)[K]
  ) {
    setRecipeForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSearchTransition(() => {
      void searchEverywhere(query).catch((error) => {
        const message =
          error instanceof Error ? error.message : "Search failed. Please try again.";
        setErrorMessage(message);
      });
    });
  }

  async function handleRecipeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingRecipe(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.set("title", recipeForm.title);
      formData.set("description", recipeForm.description);
      formData.set("ingredients", recipeForm.ingredients);
      formData.set("instructions", recipeForm.instructions);
      if (recipeImage) {
        formData.set("image", recipeImage);
      }

      const response = await fetch("/api/recipes", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Recipe upload failed.");
      }

      setRecipeForm(initialRecipeForm);
      setRecipeImage(null);

      const refreshed = await fetchLocalRecipes(query);
      setLocalRecipes(refreshed);
      setStatusMessage("Recipe saved to your local PostgreSQL collection.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save that recipe.";
      setErrorMessage(message);
    } finally {
      setIsSavingRecipe(false);
    }
  }

  async function handleDiscoverSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDiscoveringFromImage(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      if (!discoverImage) {
        throw new Error("Attach a food image first.");
      }

      const formData = new FormData();
      formData.set("image", discoverImage);

      const response = await fetch("/api/discover-from-image", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as OnlineRecipesPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not discover recipes from image.");
      }

      const normalizedQuery = payload.query.trim();
      setQuery(normalizedQuery);
      setOnlineRecipes(payload.recipes);
      setDiscoverPreviewUrl(payload.uploadedImageUrl ?? null);
      setActiveQueryLabel(normalizedQuery);

      const local = await fetchLocalRecipes(normalizedQuery);
      setLocalRecipes(local);
      setStatusMessage(
        `Detected "${normalizedQuery}" from your image and found ${payload.recipes.length} online recipes.`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image search failed. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsDiscoveringFromImage(false);
    }
  }

  return (
    <div className="relative min-h-screen pb-16">
      <div className="grain-overlay" />

      <main className="relative mx-auto w-full max-w-7xl px-4 pt-8 sm:px-8 sm:pt-12">
        <header className="card-glow overflow-hidden rounded-3xl border border-stroke/60 bg-surface-strong/85 px-6 py-8 backdrop-blur-sm sm:px-10">
          <p className="mb-4 inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-accent">
            FOOD RECIPES
          </p>
          <h1 className="max-w-3xl text-4xl leading-[1.05] text-foreground sm:text-5xl md:text-6xl">
            Search by dish, upload your own recipes, or discover ideas from food photos.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Your local recipe library is stored in PostgreSQL. Online recipes are discovered from
            TheMealDB. Image-based discovery uses OpenAI if you set `OPENAI_API_KEY`.
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 grid gap-3 rounded-2xl border border-stroke/70 bg-white/70 p-3 sm:grid-cols-[1fr_auto]"
          >
            <label className="sr-only" htmlFor="dish-search">
              Search for food
            </label>
            <input
              id="dish-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search food name, ingredient, or dish..."
              className="w-full rounded-xl border border-stroke bg-surface px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
            <button
              type="submit"
              disabled={isSearching}
              className={clsx(
                "rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                isSearching ? "cursor-not-allowed bg-accent/70" : "bg-accent hover:bg-accent-strong"
              )}
            >
              {isSearching ? "Searching..." : "Search Recipes"}
            </button>
          </form>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="card-glow rounded-2xl border border-stroke/70 bg-surface/90 p-6">
            <h2 className="text-2xl text-foreground">Upload Your Recipe</h2>
            <p className="mt-2 text-sm text-muted">
              Add your own recipe to your local collection and make it searchable.
            </p>

            <form onSubmit={handleRecipeSubmit} className="mt-5 grid gap-4">
              <input
                required
                value={recipeForm.title}
                onChange={(event) => updateRecipeForm("title", event.target.value)}
                placeholder="Recipe title"
                className="rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <textarea
                value={recipeForm.description}
                onChange={(event) => updateRecipeForm("description", event.target.value)}
                placeholder="Short description (optional)"
                rows={3}
                className="resize-none rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <textarea
                required
                value={recipeForm.ingredients}
                onChange={(event) => updateRecipeForm("ingredients", event.target.value)}
                placeholder="Ingredients (one per line or comma separated)"
                rows={4}
                className="resize-none rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <textarea
                required
                value={recipeForm.instructions}
                onChange={(event) => updateRecipeForm("instructions", event.target.value)}
                placeholder="Cooking instructions"
                rows={5}
                className="resize-none rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setRecipeImage(event.target.files?.[0] ?? null)}
                className="rounded-xl border border-dashed border-stroke bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/25"
              />
              <button
                type="submit"
                disabled={isSavingRecipe}
                className={clsx(
                  "rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                  isSavingRecipe
                    ? "cursor-not-allowed bg-accent/70"
                    : "bg-accent hover:bg-accent-strong"
                )}
              >
                {isSavingRecipe ? "Saving..." : "Save Recipe"}
              </button>
            </form>
          </section>

          <section className="card-glow rounded-2xl border border-stroke/70 bg-surface/90 p-6">
            <h2 className="text-2xl text-foreground">Find Recipes From Photo</h2>
            <p className="mt-2 text-sm text-muted">
              Upload a food picture, detect the dish name, and fetch online recipes.
            </p>

            <form onSubmit={handleDiscoverSubmit} className="mt-5 grid gap-4">
              <input
                type="file"
                accept="image/*"
                required
                onChange={(event) => setDiscoverImage(event.target.files?.[0] ?? null)}
                className="rounded-xl border border-dashed border-stroke bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/25"
              />
              <button
                type="submit"
                disabled={isDiscoveringFromImage}
                className={clsx(
                  "rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                  isDiscoveringFromImage
                    ? "cursor-not-allowed bg-accent/70"
                    : "bg-accent hover:bg-accent-strong"
                )}
              >
                {isDiscoveringFromImage ? "Analyzing..." : "Find Recipes By Image"}
              </button>
            </form>

            {discoverPreviewUrl ? (
              <div className="mt-5 overflow-hidden rounded-xl border border-stroke bg-white p-2">
                <Image
                  src={discoverPreviewUrl}
                  alt="Uploaded food preview"
                  width={720}
                  height={420}
                  className="h-52 w-full rounded-lg object-cover"
                />
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-stroke/70 bg-surface-strong/80 p-6 card-glow">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl text-foreground">
              Results for <span className="text-accent">{activeQueryLabel}</span>
            </h2>
            <p className="text-sm text-muted">
              {localRecipeCount} local recipe(s) | {onlineRecipeCount} online recipe(s)
            </p>
          </div>

          {statusMessage ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {statusMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="text-xl text-foreground">Your Local Recipes</h3>
              <div className="mt-3 grid gap-4">
                {localRecipes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stroke bg-white/70 px-4 py-5 text-sm text-muted">
                    No local recipes match this search yet.
                  </p>
                ) : (
                  localRecipes.map((recipe) => (
                    <article
                      key={recipe.id}
                      className="overflow-hidden rounded-xl border border-stroke bg-white"
                    >
                      {recipe.imageUrl ? (
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          width={900}
                          height={460}
                          className="h-40 w-full object-cover"
                        />
                      ) : null}
                      <div className="p-4">
                        <h4 className="text-lg text-foreground">{recipe.title}</h4>
                        {recipe.description ? (
                          <p className="mt-1 text-sm text-muted">{recipe.description}</p>
                        ) : null}
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                          Ingredients
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {recipe.ingredients.join(", ")}
                        </p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                          Instructions
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {previewInstructions(recipe.instructions)}
                        </p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl text-foreground">Online Matches</h3>
              <div className="mt-3 grid gap-4">
                {onlineRecipes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stroke bg-white/70 px-4 py-5 text-sm text-muted">
                    Search by dish name or upload a food image to fetch online recipe matches.
                  </p>
                ) : (
                  onlineRecipes.map((recipe) => (
                    <article
                      key={recipe.id}
                      className="overflow-hidden rounded-xl border border-stroke bg-white"
                    >
                      {recipe.thumbnail ? (
                        <Image
                          src={recipe.thumbnail}
                          alt={recipe.title}
                          width={900}
                          height={460}
                          className="h-40 w-full object-cover"
                        />
                      ) : null}
                      <div className="p-4">
                        <h4 className="text-lg text-foreground">{recipe.title}</h4>
                        <p className="mt-1 text-xs text-muted">
                          {[recipe.category, recipe.area].filter(Boolean).join(" | ") || "General"}
                        </p>
                        <p className="mt-3 text-sm text-foreground">
                          {previewInstructions(recipe.instructions)}
                        </p>
                        {recipe.sourceUrl ? (
                          <a
                            href={recipe.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-lg border border-accent/20 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20"
                          >
                            Open source recipe
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
