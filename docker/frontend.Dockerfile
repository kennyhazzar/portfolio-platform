FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile

COPY apps/frontend ./apps/frontend

# NEXT_PUBLIC_* vars are inlined into the build output at build time, not read at container
# runtime — must be a build arg, not just an environment: entry in docker-compose.yaml.
ARG NEXT_PUBLIC_SITE_URL
ARG GOOGLE_SITE_VERIFICATION
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV GOOGLE_SITE_VERIFICATION=$GOOGLE_SITE_VERIFICATION

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
