FROM node:24.5.0-slim AS builder

ARG BASE_PATH=""
ENV BASE_PATH=${BASE_PATH}

RUN apt-get update && apt-get install -y python3 python3-pip sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /home/aiagent

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY tsconfig.json next.config.mjs next-env.d.ts postcss.config.js drizzle.config.ts tailwind.config.ts ./
COPY src ./src
COPY public ./public
COPY drizzle ./drizzle
COPY prisma ./prisma

RUN mkdir -p /home/aiagent/data
RUN mkdir -p /home/aiagent/data/prompts

RUN npx prisma generate
RUN yarn build

FROM node:24.5.0-slim

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/aiagent

COPY --from=builder /home/aiagent/public ./public
COPY --from=builder /home/aiagent/.next/static ./public/_next/static
COPY --from=builder /home/aiagent/.next/standalone ./
COPY --from=builder /home/aiagent/data ./data
COPY --from=builder /home/aiagent/data/prompts ./data/prompts
COPY --from=builder /home/aiagent/src/generated/prisma ./src/generated/prisma
COPY drizzle ./drizzle
COPY prisma ./prisma

RUN mkdir /home/aiagent/uploads

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh || true

EXPOSE 3000

CMD ["/home/aiagent/entrypoint.sh"]
