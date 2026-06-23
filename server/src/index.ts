import express from 'express';
import cors from 'cors';
import { initTRPC } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { z } from 'zod';
import { db, schema } from './db';
import { eq, desc, like, or, sql } from 'drizzle-orm';
import { startScheduler } from './services/scheduler';
import { generateAirdropSummary } from './services/aiSummary';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Start background scanner
startScheduler();

// tRPC setup
const t = initTRPC.create();
const router = t.router;
const publicProcedure = t.procedure;

// Airdrops router
const airdropsRouter = router({
  list: publicProcedure
    .input(z.object({
      chain: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];
      if (input?.chain && input.chain !== '全部') {
        conditions.push(eq(schema.airdrops.chain, input.chain));
      }
      if (input?.status && input.status !== '全部') {
        conditions.push(eq(schema.airdrops.status, input.status));
      }
      if (input?.search) {
        conditions.push(
          or(
            like(schema.airdrops.name, `%${input.search}%`),
            like(schema.airdrops.protocol, `%${input.search}%`),
            like(schema.airdrops.chain, `%${input.search}%`)
          )
        );
      }

      const query = db.select().from(schema.airdrops).orderBy(desc(schema.airdrops.createdAt));
      if (conditions.length > 0) {
        return await query.where(conditions.length === 1 ? conditions[0] : undefined).limit(input?.limit || 50);
      }
      return await query.limit(input?.limit || 50);
    }),

  getOne: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [airdrop] = await db.select().from(schema.airdrops).where(eq(schema.airdrops.id, input.id));
      if (!airdrop) return null;
      const airdropTasks = await db.select().from(schema.tasks)
        .where(eq(schema.tasks.airdropId, input.id))
        .orderBy(schema.tasks.step);
      return { ...airdrop, tasks: airdropTasks };
    }),

  // Get distinct chains for filter dropdown
  chains: publicProcedure.query(async () => {
    const all = await db.select({ chain: schema.airdrops.chain }).from(schema.airdrops);
    const unique = [...new Set(all.map(a => a.chain))];
    return ['全部', ...unique];
  }),

  // Generate AI summary for an airdrop
  summarize: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [airdrop] = await db.select().from(schema.airdrops).where(eq(schema.airdrops.id, input.id));
      if (!airdrop) throw new Error('Airdrop not found');
      
      const summary = await generateAirdropSummary({
        name: airdrop.name,
        protocol: airdrop.protocol,
        chain: airdrop.chain,
        description: airdrop.description || '',
      });

      await db.update(schema.airdrops)
        .set({ guide: summary })
        .where(eq(schema.airdrops.id, input.id));

      return { summary };
    }),
});

// Users router
const usersRouter = router({
  register: publicProcedure
    .input(z.object({
      address: z.string(),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check if user exists
      const [existing] = await db.select().from(schema.users).where(eq(schema.users.address, input.address));
      if (existing) return existing;

      const code = `DH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      let referrerId: number | undefined;

      // Resolve referral code
      if (input.referralCode) {
        const [referrer] = await db.select().from(schema.users).where(eq(schema.users.referralCode, input.referralCode));
        if (referrer) referrerId = referrer.id;
      }

      const [user] = await db.insert(schema.users).values({
        address: input.address,
        referralCode: code,
        referrerId,
      }).returning();

      // Create referral record if applicable
      if (referrerId) {
        await db.insert(schema.referrals).values({
          referrerId,
          refereeId: user.id,
        });
      }

      return user;
    }),

  getMe: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.address, input.address));
      return user || null;
    }),
});

// Stats router
const statsRouter = router({
  dashboard: publicProcedure.query(async () => {
    const [airdropCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.airdrops);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.airdrops).where(eq(schema.airdrops.status, 'active'));
    return {
      totalAirdrops: airdropCount.count,
      activeAirdrops: activeCount.count,
      totalUsers: userCount.count,
    };
  }),
});

// App router
const appRouter = router({
  airdrops: airdropsRouter,
  users: usersRouter,
  stats: statsRouter,
  health: publicProcedure.query(() => ({ status: 'ok', timestamp: Date.now() })),
});

export type AppRouter = typeof appRouter;

// Mount tRPC
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: () => ({}),
}));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/public'));
  app.get('*', (_, res) => {
    res.sendFile('dist/public/index.html', { root: '.' });
  });
} else {
  app.get('/', (_, res) => {
    res.json({ message: '🪂 DropHunter API', trpc: '/api/trpc' });
  });
}

app.listen(PORT, () => {
  console.log(`🪂 DropHunter running on http://localhost:${PORT}`);
});
