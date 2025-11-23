import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const g = globalThis as any;
export const prisma = g.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
