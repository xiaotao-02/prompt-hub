# AI Prompt Studio Platform API — build from monorepo root (Zeabur api service fallback)
# Build context: repository root. Only copies services/api; never loads extension src/.
FROM node:22-bookworm AS builder

WORKDIR /app

COPY services/api/package.json services/api/package-lock.json ./
RUN npm ci

COPY services/api/tsconfig.json ./
COPY services/api/src ./src
RUN npm run build
# Drop devDeps; keep prebuilt better-sqlite3 native bindings (no rebuild)
RUN npm prune --omit=dev

FROM node:22-bookworm-slim

WORKDIR /app

COPY services/api/package.json services/api/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/platform.db

VOLUME ["/data"]
# Zeabur injects PORT at runtime; local default 8787 is in src/env.ts
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const p=Number(process.env.PORT)||8787;fetch('http://127.0.0.1:'+p+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
