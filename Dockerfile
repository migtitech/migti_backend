# migti_backend - Node/Express API
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies (npm install so xlsx is resolved from registry if lockfile is stale)
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# Build (Babel compile src -> dist)
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN mkdir -p dist/public assets assets/temp uploads

# Optional: create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 7200
CMD ["node", "dist/index.js"]
