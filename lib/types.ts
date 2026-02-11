export type LocalRecipe = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OnlineRecipe = {
  id: string;
  title: string;
  thumbnail: string | null;
  sourceUrl: string | null;
  area: string | null;
  category: string | null;
  instructions: string | null;
  ingredients: string[];
};
