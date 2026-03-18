FROM node:22-slim AS base
RUN corepack enable pnpm

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.json ./

# Copy package manifests
COPY packages/athanor-core/package.json packages/athanor-core/
COPY packages/athanor-extractor/package.json packages/athanor-extractor/
COPY apps/clone-api/package.json apps/clone-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/athanor-core/ packages/athanor-core/
COPY packages/athanor-extractor/ packages/athanor-extractor/
COPY apps/clone-api/ apps/clone-api/

# Build
RUN pnpm --filter @athanor/core build && \
    pnpm --filter @athanor/extractor build && \
    pnpm --filter @athanor/clone-api build

# ─── Production stage ────────────────────────────────────────────────────────

FROM node:22-slim AS production
RUN corepack enable pnpm

WORKDIR /app

COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/athanor-core/package.json packages/athanor-core/
COPY --from=base /app/packages/athanor-core/dist/ packages/athanor-core/dist/
COPY --from=base /app/packages/athanor-extractor/package.json packages/athanor-extractor/
COPY --from=base /app/packages/athanor-extractor/dist/ packages/athanor-extractor/dist/
COPY --from=base /app/packages/athanor-extractor/prompts/ packages/athanor-extractor/prompts/
COPY --from=base /app/apps/clone-api/package.json apps/clone-api/
COPY --from=base /app/apps/clone-api/dist/ apps/clone-api/dist/

RUN pnpm install --frozen-lockfile --prod

ENV PORT=3000
ENV LLM_PROVIDER=ollama
EXPOSE 3000

CMD ["node", "apps/clone-api/dist/index.js"]
