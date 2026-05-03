FROM node:20-alpine

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/viewer/package.json ./apps/viewer/

# Install all dependencies
RUN pnpm install

# Copy source (volumes override these in dev, but needed for first build)
COPY packages/shared/src ./packages/shared/src
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/viewer/src ./apps/viewer/src
COPY apps/viewer/tsconfig.json ./apps/viewer/
COPY apps/viewer/vite.config.ts ./apps/viewer/

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build the viewer bundle so the backend can serve viewer.js
RUN cd apps/viewer && pnpm build

COPY apps/backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
