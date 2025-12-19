# GEMINI.md - Project Context

## Project Overview
**aiagent** is a privacy-focused, open-source AI answering engine (similar to Perplexity.ai) that runs locally. It acts as a search interface that combines web search results (via SearxNG) with LLM capabilities (Local via Ollama, or Cloud via OpenAI, Anthropic, etc.) to provide cited answers.

## Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite (managed by [Drizzle ORM](https://orm.drizzle.team/))
  - *Note: There is also a `prisma` folder and `src/lib/postgres`, indicating potential/upcoming PostgreSQL support, but the active setup in `src/lib/db/index.ts` is SQLite.*
- **AI/LLM Orchestration:** [LangChain](https://js.langchain.com/)
- **Search Engine:** SearxNG (bundled via Docker)
- **Deployment:** Docker

## Architecture
### Directory Structure
- **`src/app/`**: Next.js App Router pages and API routes.
  - **`api/`**: Backend endpoints (`chat`, `config`, `search`, etc.).
  - **`components/`**: Reusable UI components (Chat interface, Settings, etc.).
- **`src/lib/`**: Core application logic.
  - **`db/`**: Drizzle ORM schema (`schema.ts`) and client instance (`index.ts`).
  - **`config/`**: App-wide configuration logic.
  - **`search/`**: Search provider implementations.
  - **`providers/`**: LLM provider integrations.
- **`data/`**: Local storage for the SQLite database (`db.sqlite`).
- **`uploads/`**: Storage for user-uploaded files.
- **`drizzle/`**: Database migrations.

### Data Model (SQLite)
Defined in `src/lib/db/schema.ts`:
- **`chats`**: Stores chat sessions (ID, title, focus mode, attached files).
- **`messages`**: Stores individual messages within a chat (content, role, sources).

## Setup & Development

### 1. Docker (Recommended)
The project is designed to run via Docker, which handles the `aiagent` app and the `searxng` instance.
```bash
docker-compose up -d
```
*See `docker-compose.yaml` for service definitions.*

### 2. Local Development (Manual)
If running without Docker, you must have a SearxNG instance running separately.

**Install Dependencies:**
```bash
npm install
```

**Database Setup:**
The project uses SQLite. Drizzle Kit is used for migrations.
```bash
# Generate migrations (if schema changes)
npx drizzle-kit generate

# Push changes to DB (if needed)
# (Check package.json for specific migration scripts if available)
```

**Run Development Server:**
```bash
npm run dev
```
Access at `http://localhost:3000`.

**Build:**
```bash
npm run build
npm run start
```

## Key Configuration
- **`drizzle.config.ts`**: Configuration for Drizzle ORM (SQLite).
- **`prisma/schema.prisma`**: Prisma schema (PostgreSQL) - *currently secondary/inactive*.
- **`next.config.mjs`**: Next.js configuration.
- **`tailwind.config.ts`**: Tailwind CSS configuration.

## Development Conventions
- **Components**: Functional components with TypeScript interfaces.
- **Styling**: Utility-first with Tailwind CSS.
- **State**: React hooks and context.
- **API**: Next.js Route Handlers in `src/app/api`.
