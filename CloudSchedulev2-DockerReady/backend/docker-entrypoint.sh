#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing database schema (this will create tables if they don't exist)..."
npx prisma db push --skip-generate

echo "Seeding database..."
npx tsx src/seed.ts || echo "Seed script completed (may have skipped existing data)"

echo "Starting server..."
exec npm start

