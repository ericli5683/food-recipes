import type { OnlineRecipe } from "@/lib/types";

const MEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

type MealDBMeal = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string | null;
  strSource: string | null;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  [key: string]: string | null;
};

type MealDBResponse = {
  meals: MealDBMeal[] | null;
};

async function mealDbFetch(path: string): Promise<MealDBResponse> {
  const response = await fetch(`${MEALDB_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MealDB request failed with status ${response.status}`);
  }

  return (await response.json()) as MealDBResponse;
}

function getIngredients(meal: MealDBMeal): string[] {
  const ingredients: string[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (!ingredient) {
      continue;
    }

    ingredients.push(measure ? `${measure} ${ingredient}` : ingredient);
  }

  return ingredients;
}

function toOnlineRecipe(meal: MealDBMeal): OnlineRecipe {
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    thumbnail: meal.strMealThumb,
    sourceUrl: meal.strSource,
    area: meal.strArea,
    category: meal.strCategory,
    instructions: meal.strInstructions,
    ingredients: getIngredients(meal),
  };
}

async function fetchMealById(id: string): Promise<MealDBMeal | null> {
  const result = await mealDbFetch(`/lookup.php?i=${encodeURIComponent(id)}`);
  return result.meals?.[0] ?? null;
}

export async function searchOnlineRecipes(query: string): Promise<OnlineRecipe[]> {
  const searchTerm = query.trim();
  if (!searchTerm) {
    return [];
  }

  const [nameMatch, ingredientMatch] = await Promise.all([
    mealDbFetch(`/search.php?s=${encodeURIComponent(searchTerm)}`),
    mealDbFetch(`/filter.php?i=${encodeURIComponent(searchTerm)}`),
  ]);

  const fromName = (nameMatch.meals ?? []).map(toOnlineRecipe);
  const ingredientMeals = ingredientMatch.meals ?? [];
  const ingredientIds = ingredientMeals.slice(0, 6).map((meal) => meal.idMeal);

  const ingredientDetails = await Promise.all(
    ingredientIds.map(async (id) => fetchMealById(id))
  );

  const fromIngredients = ingredientDetails
    .filter((meal): meal is MealDBMeal => meal !== null)
    .map(toOnlineRecipe);

  const deduped = new Map<string, OnlineRecipe>();
  [...fromName, ...fromIngredients].forEach((recipe) => {
    deduped.set(recipe.id, recipe);
  });

  return Array.from(deduped.values());
}
