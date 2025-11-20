# Backend Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL and other required dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./

# Install all dependencies (including devDependencies for tsx and prisma CLI)
RUN npm install

# Copy Prisma files
COPY prisma ./prisma

# Generate Prisma Client in production stage
RUN npx prisma generate

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy source for seed script
COPY src/seed.ts ./src/seed.ts

# Copy tsx from builder (needed for running seed script)
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Copy entrypoint script and set permissions
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod 755 ./docker-entrypoint.sh

# Expose port
EXPOSE 5000

# Use entrypoint script
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]

