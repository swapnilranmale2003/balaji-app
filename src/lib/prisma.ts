import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Next.js hot-reloads modules in development, which would otherwise open a new
// connection pool on every reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Locally, copy .env.example to .env. " +
        "On a host such as Vercel, add it to the project's environment variables.",
    );
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * Constructed on first use rather than at import time. `next build` imports
 * every route to collect page data, and connecting there would fail the build
 * on any host that supplies DATABASE_URL only at runtime.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = globalForPrisma.prisma ?? createPrismaClient();
    return Reflect.get(client, property, receiver);
  },
});
