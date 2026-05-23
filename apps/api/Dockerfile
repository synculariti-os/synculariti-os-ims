FROM node:20-alpine AS base
# Set up pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
# Set working directory
WORKDIR /app
# Install turbo globally
RUN npm install -g turbo
# Copy source code
COPY . .
# Prune the workspace to only include the @ims/api package and its dependencies
RUN turbo prune @ims/api --docker

FROM base AS installer
WORKDIR /app

# First install dependencies (cache optimization)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=@ims/api...

FROM base AS runner
WORKDIR /app

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy the built output from installer
COPY --from=installer --chown=nestjs:nodejs /app .

# Set working directory to the API app
WORKDIR /app/apps/api

USER nestjs

# NextJS/NestJS standard port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start the NestJS application
CMD ["pnpm", "start"]
