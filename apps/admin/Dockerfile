FROM node:20-alpine

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/

# Install dependencies
RUN pnpm install

# Copy source (volumes override in dev)
COPY packages/shared/src ./packages/shared/src
COPY apps/admin ./apps/admin

EXPOSE 3000

WORKDIR /app/apps/admin

CMD ["pnpm", "dev"]
