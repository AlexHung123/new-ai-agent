FROM node:24.5.0-slim AS builder

ARG BASE_PATH=""
ENV BASE_PATH=${BASE_PATH}

RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /home/aiagent

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json next.config.mjs next-env.d.ts postcss.config.js drizzle.config.ts tailwind.config.ts ./
COPY src ./src
COPY public ./public
COPY drizzle ./drizzle
COPY prisma ./prisma

RUN mkdir -p /home/aiagent/data
COPY data/documents ./data/documents
COPY data/prompts ./data/prompts

RUN npx prisma generate
RUN npm run build

FROM node:24.5.0-slim

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/aiagent

COPY --from=builder /home/aiagent/public ./public
COPY --from=builder /home/aiagent/.next/static ./public/_next/static
COPY --from=builder /home/aiagent/.next/standalone ./
COPY --from=builder /home/aiagent/node_modules/@firecrawl ./node_modules/@firecrawl
COPY --from=builder /home/aiagent/node_modules/pdfjs-dist ./node_modules/pdfjs-dist
# Native addons are serverExternalPackages; standalone tracing often drops the .node files.
COPY --from=builder /home/aiagent/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /home/aiagent/node_modules/bindings ./node_modules/bindings
COPY --from=builder /home/aiagent/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder /home/aiagent/data ./data
COPY --from=builder /home/aiagent/src/generated/prisma ./src/generated/prisma
COPY drizzle ./drizzle
COPY prisma ./prisma

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh || true

EXPOSE 3000

CMD ["/home/aiagent/entrypoint.sh"]
