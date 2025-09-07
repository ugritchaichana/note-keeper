import { PrismaClient } from '@prisma/client';

// Fix DATABASE_URL if it doesn't have protocol prefix
function fixDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  // If URL already has protocol, return as is
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return url;
  }

  // If URL doesn't have protocol, add postgresql://
  if (url.includes('@') && !url.startsWith('http')) {
    return `postgresql://${url}`;
  }

  return url;
}

// Prevent creating many PrismaClient instances in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: fixDatabaseUrl(process.env.DATABASE_URL),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
