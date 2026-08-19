# Shared build for every Node/TS service in the monorepo — one Dockerfile,
# parameterized by SERVICE_DIR, instead of five near-identical copies.
# Builds the whole workspace (TypeScript project references mean building
# one service's dist correctly requires its dependencies built too) and
# runs a single service's dist/server.js at the end.
#
# First real deploy image (2026-08-19) — see BACKLOG.md for the deploy plan
# this supports and Manus's Klendoo Environment Handoff for why /opt/klendoo
# is the reserved release path this gets shipped to.

FROM node:22-bookworm-slim AS build

# Prisma's engine-selection needs to detect the actual libssl version present
# rather than guess — without this it silently defaulted to openssl-1.1.x
# and warned during the real build, which risks shipping the wrong query
# engine binary.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# prisma generate (npm ci's postinstall) only needs a syntactically valid
# DATABASE_URL to resolve the schema's env("DATABASE_URL") — it does not
# connect. The real value is supplied at container start by docker-compose,
# overriding this build-time placeholder.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"

WORKDIR /repo
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
COPY apps ./apps

RUN npm ci && npm run build

FROM node:22-bookworm-slim AS runtime

# Same reasoning as the build stage — the Prisma query engine binary
# (already generated against the detected libssl) needs the matching
# runtime library present too.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Which service this image runs — set via docker-compose's build.args per
# service (e.g. "services/negotiation-agent", "apps/landing").
ARG SERVICE_DIR
ENV SERVICE_DIR=${SERVICE_DIR}
ENV NODE_ENV=production

WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/services ./services
COPY --from=build /repo/apps ./apps

# Shell form so ${SERVICE_DIR} expands — each service's package.json start
# script is always `node dist/server.js`, so this is uniform across all of
# them without needing per-service CMD overrides.
CMD ["sh", "-c", "node ${SERVICE_DIR}/dist/server.js"]
