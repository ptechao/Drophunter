import express from 'express';
import cors from 'cors';
import { initTRPC } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { z } from 'zod';
import { db, schema } from './db';
import { eq, desc } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
    }).optional())
    .query(async ({ input }) => {
      const all = await db.select().from(schema.airdrops).orderBy(desc(schema.airdrops.createdAt));
      return all.filter(a => {
        if (input?.chain && input.chain !== '全部' && a.chain !== input.chain) return false;
        if (input?.status && input.status !== '全部' && a.status !== input.status) return false;
        if (input?.search && !a.name.toLowerCase().includes(input.search.toLowerCase())) return false;
        return true;
      });
    }),

  getOne: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [airdrop] = await db.select().from(schema.airdrops).where(eq(schema.airdrops.id, input.id));
      const airdropTasks = await db.select().from(schema.tasks).where(eq(schema.tasks.airdropId, input.id)).orderBy(schema.tasks.step);
      return { ...airdrop, tasks: airdropTasks };
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
      const referralCode = `DH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const [user] = await db.insert(schema.users).values({
        address: input.address,
        referralCode,
        referrerId: undefined, // TODO: resolve referral code
      }).returning();
      return user;
    }),
});

// App router
const appRouter = router({
  airdrops: airdropsRouter,
  users: usersRouter,
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
    res.json({ message: 'DropHunter API', trpc: '/api/trpc' });
  });
}

app.listen(PORT, () => {
  console.log(`🪂 DropHunter running on http://localhost:${PORT}`);
});
