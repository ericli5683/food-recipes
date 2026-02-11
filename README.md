# Food Recipes

Full-stack Next.js app for:

- Saving your own recipes in PostgreSQL
- Searching recipes by food name or ingredient
- Uploading a food photo to detect dish name and fetch online recipes
- Showing online recipe results from TheMealDB

## Tech Stack

- Next.js 16 (App Router, frontend + backend in one repository)
- TypeScript
- Tailwind CSS v4
- Prisma ORM
- PostgreSQL
- OpenAI (optional, for image-based dish detection)

## 1. Environment Setup

Create `.env` from `.env.example` and set your credentials:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/food_recipes?schema=public"
OPENAI_API_KEY=""
```

`OPENAI_API_KEY` is optional for text search, but required for photo-to-recipe discovery.

## 2. Install and Prepare Database

Start PostgreSQL locally (Docker option):

```bash
docker compose up -d
```

Then run:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

If you prefer SQL directly, the generated bootstrap script is in `prisma/init.sql`.

## 3. Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Routes

- `GET /api/recipes?q=<term>`: Search local PostgreSQL recipes
- `POST /api/recipes`: Create local recipe (supports multipart form data with optional image)
- `GET /api/discover?q=<term>`: Search online recipes from TheMealDB
- `POST /api/discover-from-image`: Upload image, detect dish with OpenAI, fetch online matches

## Notes

- Uploaded images are stored in `public/uploads`.
- Online recipe result quality depends on available public data from TheMealDB.
