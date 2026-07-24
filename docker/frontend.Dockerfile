FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile

COPY apps/frontend ./apps/frontend
RUN pnpm --filter @portfolio/frontend build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Next's standalone output mirrors the monorepo path (apps/frontend/server.js), not a flat server.js —
# see docs/planning/01-monorepo-and-infra.md §4.
COPY --from=build --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build --chown=node:node /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

USER node

CMD ["node", "apps/frontend/server.js"]
