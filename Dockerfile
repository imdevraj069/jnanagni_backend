# 1. Base Image
FROM node:22-alpine AS base

# Setup PNPM environment variables
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Enable corepack so we can use pnpm without installing it globally manually
RUN corepack enable

# 2. Dependencies Stage
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json and the lockfile
# Note: Ensure your file is named 'pnpm-lock.yaml'. 
# If it is literally 'package.lock.yaml', rename it to 'pnpm-lock.yaml' locally first!
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen-lockfile is the pnpm equivalent of npm ci)
RUN pnpm install --frozen-lockfile --prod

# 3. Builder Stage (Optional for plain Node, but keeps structure consistent)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# If you run a build script, uncomment below:
# RUN pnpm run build

# 4. Runner Stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 node_user

# Copy source and modules
COPY --from=builder --chown=node_user:nodejs /app/package.json ./package.json
COPY --from=builder --chown=node_user:nodejs /app/src ./src
COPY --from=builder --chown=node_user:nodejs /app/node_modules ./node_modules

USER node_user

EXPOSE 8001

CMD ["node", "src/server.js"]