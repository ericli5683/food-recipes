type SearchableRecipeParts = {
  title: string;
  description?: string | null;
  ingredients: string[];
  instructions: string;
};

export function parseIngredients(raw: string): string[] {
  return raw
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildSearchableText(parts: SearchableRecipeParts): string {
  return [parts.title, parts.description ?? "", ...parts.ingredients, parts.instructions]
    .join(" ")
    .toLowerCase();
}
