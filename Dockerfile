# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat curl
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src/database/schema.prisma ./prisma/schema.prisma

RUN npm ci

COPY src ./src

RUN npx prisma generate
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init openssl curl

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and generated prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create log directory
RUN mkdir -p logs && chown -R node:node logs

USER node

EXPOSE 3000

CMD ["dumb-init", "node", "dist/server.js"]
