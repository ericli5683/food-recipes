import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing.");
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

const recipes = [
  {
    title: "Lasagne",
    description:
      "Classic layered pasta with beef ragu, creamy white sauce, and baked cheese.",
    ingredients: [
      "Lasagne sheets",
      "Ground beef",
      "Onion",
      "Garlic",
      "Tomato passata",
      "Tomato paste",
      "Olive oil",
      "Milk",
      "Butter",
      "Flour",
      "Parmesan cheese",
      "Mozzarella cheese",
      "Salt",
      "Black pepper",
    ],
    instructions:
      "Cook onion and garlic in olive oil, brown beef, and simmer with tomato passata and paste. Make a white sauce by cooking butter and flour, then whisk in milk until thick. Layer sauce, lasagne sheets, white sauce, and cheese in a baking dish. Repeat layers and finish with cheese. Bake at 190C/375F until bubbling and golden.",
    imageUrl: null,
    externalUrl: "https://www.bbcgoodfood.com/recipes/lasagne",
  },
  {
    title: "Chicken Biryani",
    description:
      "Fragrant rice dish with spiced chicken, herbs, and aromatic whole spices.",
    ingredients: [
      "Chicken thighs",
      "Basmati rice",
      "Onion",
      "Garlic",
      "Ginger",
      "Yogurt",
      "Tomatoes",
      "Garam masala",
      "Turmeric",
      "Cumin",
      "Coriander powder",
      "Chili powder",
      "Bay leaf",
      "Cinnamon stick",
      "Cardamom",
      "Cilantro",
      "Mint",
      "Salt",
    ],
    instructions:
      "Marinate chicken with yogurt, garlic, ginger, and spices. Fry onions until golden and reserve some for garnish. Cook marinated chicken with tomatoes until nearly done. Parboil basmati rice with whole spices. Layer chicken and rice in a pot with herbs and fried onions. Cover tightly and steam on low heat until rice is fully cooked and aromatic.",
    imageUrl: null,
    externalUrl: "https://www.bbcgoodfood.com/recipes/chicken-biryani",
  },
  {
    title: "Shakshuka",
    description:
      "Eggs poached in a spiced tomato and pepper sauce, served with crusty bread.",
    ingredients: [
      "Eggs",
      "Tomatoes",
      "Red bell pepper",
      "Onion",
      "Garlic",
      "Olive oil",
      "Paprika",
      "Cumin",
      "Chili flakes",
      "Salt",
      "Black pepper",
      "Parsley",
    ],
    instructions:
      "Saute onion and pepper in olive oil, then add garlic and spices. Stir in tomatoes and simmer until thick. Make wells in the sauce and crack in eggs. Cover and cook until egg whites are set. Garnish with parsley and serve hot with bread.",
    imageUrl: null,
    externalUrl: "https://downshiftology.com/recipes/shakshuka/",
  },
  {
    title: "Chickpea Curry",
    description:
      "Creamy coconut curry with chickpeas, tomato, and warming spices.",
    ingredients: [
      "Chickpeas",
      "Coconut milk",
      "Onion",
      "Garlic",
      "Ginger",
      "Tomato sauce",
      "Curry powder",
      "Cumin",
      "Turmeric",
      "Olive oil",
      "Salt",
      "Black pepper",
      "Cilantro",
    ],
    instructions:
      "Cook onion, garlic, and ginger until fragrant. Add curry powder, cumin, and turmeric briefly. Add tomato sauce, chickpeas, and coconut milk; simmer until thickened. Season with salt and pepper, then finish with cilantro. Serve with rice or flatbread.",
    imageUrl: null,
    externalUrl: "https://www.budgetbytes.com/coconut-curry-chickpeas/",
  },
  {
    title: "Butter Chicken",
    description:
      "Tender chicken in a rich tomato-butter sauce with warm Indian spices.",
    ingredients: [
      "Chicken thighs",
      "Yogurt",
      "Lemon juice",
      "Garlic",
      "Ginger",
      "Tomato puree",
      "Heavy cream",
      "Butter",
      "Garam masala",
      "Cumin",
      "Paprika",
      "Turmeric",
      "Chili powder",
      "Salt",
      "Cilantro",
    ],
    instructions:
      "Marinate chicken in yogurt, lemon, and spices. Sear or grill chicken until lightly charred and mostly cooked. Simmer tomato puree with butter, garlic, ginger, and spices. Stir in cream, add chicken, and cook until tender. Garnish with cilantro and serve with rice or naan.",
    imageUrl: null,
    externalUrl: "https://www.recipetineats.com/butter-chicken/",
  },
  {
    title: "Beef Tacos with Salsa Verde",
    description:
      "Seasoned beef tacos finished with bright salsa verde and fresh toppings.",
    ingredients: [
      "Ground beef",
      "Corn tortillas",
      "Onion",
      "Garlic",
      "Cumin",
      "Paprika",
      "Chili powder",
      "Tomatillos",
      "Jalapeno",
      "Cilantro",
      "Lime",
      "Salt",
      "Black pepper",
    ],
    instructions:
      "Cook beef with onion, garlic, and spices until browned and flavorful. Roast or boil tomatillos and jalapeno, then blend with cilantro, lime, and salt for salsa verde. Warm tortillas and fill with beef. Top with salsa verde and extra onion/cilantro.",
    imageUrl: null,
    externalUrl:
      "https://www.foodnetwork.com/recipes/food-network-kitchen/beef-tacos-with-salsa-verde-3363176",
  },
  {
    title: "Neapolitan-Style Pizza Crust",
    description:
      "High-heat pizza crust with a chewy interior and blistered edges.",
    ingredients: [
      "Bread flour",
      "Water",
      "Instant yeast",
      "Salt",
      "Olive oil",
      "Tomato sauce",
      "Mozzarella cheese",
      "Basil leaves",
    ],
    instructions:
      "Mix flour, water, yeast, and salt into a soft dough and knead until smooth. Let rise until doubled, then divide into dough balls and rest. Stretch dough by hand, add sauce and mozzarella, and bake on a hot stone or steel at highest oven temperature until crust blisters. Finish with basil and olive oil.",
    imageUrl: null,
    externalUrl:
      "https://www.kingarthurbaking.com/recipes/neapolitan-style-pizza-crust-recipe",
  },
  {
    title: "Guacamole with Lime and Roasted Chilies",
    description:
      "Chunky guacamole with ripe avocado, lime, and smoky roasted chili heat.",
    ingredients: [
      "Ripe avocados",
      "Lime juice",
      "Roasted green chilies",
      "Red onion",
      "Cilantro",
      "Jalapeno",
      "Salt",
      "Black pepper",
    ],
    instructions:
      "Mash avocados to your preferred texture. Fold in lime juice, chopped roasted chilies, onion, jalapeno, and cilantro. Season with salt and pepper. Serve immediately with chips, tacos, or grilled meats.",
    imageUrl: null,
    externalUrl:
      "https://www.bonappetit.com/recipe/guacamole-with-lime-and-roasted-chilies",
  },
];

function searchableText(recipe) {
  return [recipe.title, recipe.description, ...recipe.ingredients, recipe.instructions]
    .join(" ")
    .toLowerCase();
}

async function main() {
  const externalUrls = recipes.map((recipe) => recipe.externalUrl);

  await prisma.recipe.deleteMany({
    where: {
      source: "ONLINE_IMPORTED",
      externalUrl: {
        in: externalUrls,
      },
    },
  });

  await prisma.recipe.createMany({
    data: recipes.map((recipe) => ({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      imageUrl: recipe.imageUrl,
      source: "ONLINE_IMPORTED",
      externalUrl: recipe.externalUrl,
      searchableText: searchableText(recipe),
    })),
  });

  const count = await prisma.recipe.count({
    where: {
      source: "ONLINE_IMPORTED",
      externalUrl: {
        in: externalUrls,
      },
    },
  });

  console.log(`Imported ${count} web recipes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
