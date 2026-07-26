import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Next.js hot-reloads modules in development, which would otherwise create a new
 * PrismaClient (and a new connection pool) on every reload. Caching the instance
 * on `globalThis` keeps a single client alive across reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
  }

  // Prisma 7 requires an explicit driver adapter. Swapping databases means
  // swapping this adapter (e.g. @prisma/adapter-pg for PostgreSQL) and the
  // provider in prisma/schema.prisma.
  const adapter = new PrismaBetterSqlite3({ url });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
