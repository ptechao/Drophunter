import express from 'express';
import cors from 'cors';
import { initTRPC, TRPCError } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { z } from 'zod';
import { db, schema } from './db';
import { eq, desc, like, or, sql, and } from 'drizzle-orm';
import { startScheduler } from './services/scheduler';
import { generateAirdropSummary } from './services/aiSummary';
import { verifyTransaction, getNativeBalance, verifyAirdropTasks, rpcHealthCheck } from './services/chainRpc';

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-change-me';

app.use(cors());
app.use(express.json());

// Start background scanner
startScheduler();

// ─── Create context with admin key extraction ───
const createContext = (req: express.Request) => ({
  adminKey: req.headers['x-admin-key'] as string | undefined,
});

type Context = ReturnType<typeof createContext>;

// ─── tRPC setup ───
const t = initTRPC.context<Context>().create();
const router = t.router;
const publicProcedure = t.procedure;

// Protected admin procedure
const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.adminKey || ctx.adminKey !== ADMIN_KEY) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid admin key' });
  }
  return next();
});

// ─── Public: Airdrops router ───
const airdropsRouter = router({
  list: publicProcedure
    .input(z.object({
      chain: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const conditions = [eq(schema.airdrops.disabled, 0)];
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
      return await db.select().from(schema.airdrops)
        .where(and(...conditions))
        .orderBy(desc(schema.airdrops.createdAt))
        .limit(input?.limit || 50);
    }),

  getOne: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [airdrop] = await db.select().from(schema.airdrops)
        .where(and(eq(schema.airdrops.id, input.id), eq(schema.airdrops.disabled, 0)));
      if (!airdrop) return null;
      const airdropTasks = await db.select().from(schema.tasks)
        .where(eq(schema.tasks.airdropId, input.id))
        .orderBy(schema.tasks.step);
      return { ...airdrop, tasks: airdropTasks };
    }),

  chains: publicProcedure.query(async () => {
    const all = await db.select({ chain: schema.airdrops.chain })
      .from(schema.airdrops).where(eq(schema.airdrops.disabled, 0));
    const unique = [...new Set(all.map(a => a.chain))];
    return ['全部', ...unique];
  }),

  summarize: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [airdrop] = await db.select().from(schema.airdrops)
        .where(and(eq(schema.airdrops.id, input.id), eq(schema.airdrops.disabled, 0)));
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

// ─── Public: Users router ───
const usersRouter = router({
  register: publicProcedure
    .input(z.object({
      address: z.string(),
      referralCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [existing] = await db.select().from(schema.users).where(eq(schema.users.address, input.address));
      if (existing) return existing;
      const code = `DH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      let referrerId: number | undefined;
      if (input.referralCode) {
        const [referrer] = await db.select().from(schema.users).where(eq(schema.users.referralCode, input.referralCode));
        if (referrer) referrerId = referrer.id;
      }
      const [user] = await db.insert(schema.users).values({
        address: input.address,
        referralCode: code,
        referrerId,
      }).returning();
      if (referrerId) {
        await db.insert(schema.referrals).values({ referrerId, refereeId: user.id });
      }
      return user;
    }),

  getMe: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.address, input.address));
      return user || null;
    }),

  myReferrals: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const refs = await db.select().from(schema.referrals)
        .where(eq(schema.referrals.referrerId, input.userId))
        .orderBy(desc(schema.referrals.createdAt));
      return refs;
    }),

  myPayments: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.select().from(schema.payments)
        .where(eq(schema.payments.userId, input.userId))
        .orderBy(desc(schema.payments.createdAt));
    }),
});

// ─── Public: Stats router ───
const statsRouter = router({
  dashboard: publicProcedure.query(async () => {
    const [airdropCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.airdrops).where(eq(schema.airdrops.disabled, 0));
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.airdrops).where(and(eq(schema.airdrops.status, 'active'), eq(schema.airdrops.disabled, 0)));
    const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(schema.payments).where(eq(schema.payments.status, 'confirmed'));
    const [vipCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.tier, 'vip'));
    return {
      totalAirdrops: airdropCount.count,
      activeAirdrops: activeCount.count,
      totalUsers: userCount.count,
      vipUsers: vipCount.count,
      totalRevenue: revenueResult.total,
    };
  }),
});

// ═══════════════════════════════════════════════════════════
// ─── ADMIN ROUTER ───
// ═══════════════════════════════════════════════════════════

// Helper: credit referral commission (20%)
async function creditReferralCommission(userId: number, amount: number) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user?.referrerId) return;
  const commission = Math.round(amount * 0.2 * 100) / 100; // 20%
  // Find the referral record
  const [ref] = await db.select().from(schema.referrals)
    .where(eq(schema.referrals.refereeId, userId));
  if (ref) {
    await db.update(schema.referrals)
      .set({ earnings: sql`COALESCE(earnings, 0) + ${commission}` })
      .where(eq(schema.referrals.id, ref.id));
  }
}

const adminRouter = router({
  // ── Admin: Auth check ──
  check: publicProcedure.query(async ({ ctx }) => {
    return { ok: ctx.adminKey === ADMIN_KEY };
  }),

  // ── Admin: Dashboard stats ──
  dashboard: adminProcedure.query(async () => {
    // Basic counts
    const [totalAirdrops] = await db.select({ count: sql<number>`count(*)` }).from(schema.airdrops);
    const [activeAirdrops] = await db.select({ count: sql<number>`count(*)` }).from(schema.airdrops).where(eq(schema.airdrops.status, 'active'));
    const [disabledCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.airdrops).where(eq(schema.airdrops.disabled, 1));
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    const [freeUsers] = await db.select({ count: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.tier, 'free'));
    const [vipUsers] = await db.select({ count: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.tier, 'vip'));
    const [totalPayments] = await db.select({ count: sql<number>`count(*)` }).from(schema.payments);
    const [confirmedPayments] = await db.select({ count: sql<number>`count(*)` }).from(schema.payments).where(eq(schema.payments.status, 'confirmed'));
    const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(schema.payments).where(eq(schema.payments.status, 'confirmed'));
    const [pendingRevenue] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(schema.payments).where(eq(schema.payments.status, 'pending'));
    const [referralCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.referrals);

    // Revenue by month (last 6 months)
    const revenueByMonth = await db.all<{ month: string; amount: number }>(
      sql`SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(amount), 0) as amount 
          FROM payments WHERE status = 'confirmed' 
          GROUP BY month ORDER BY month DESC LIMIT 6`
    );

    // User registrations by month (last 6 months)
    const usersByMonth = await db.all<{ month: string; count: number }>(
      sql`SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count 
          FROM users GROUP BY month ORDER BY month DESC LIMIT 6`
    );

    // Top chains by airdrop count
    const chainsBreakdown = await db.all<{ chain: string; count: number }>(
      sql`SELECT chain, COUNT(*) as count FROM airdrops GROUP BY chain ORDER BY count DESC`
    );

    return {
      counts: {
        totalAirdrops: totalAirdrops.count,
        activeAirdrops: activeAirdrops.count,
        disabledAirdrops: disabledCount.count,
        totalUsers: totalUsers.count,
        freeUsers: freeUsers.count,
        vipUsers: vipUsers.count,
        totalPayments: totalPayments.count,
        confirmedPayments: confirmedPayments.count,
        totalRevenue: revenue.total,
        pendingRevenue: pendingRevenue.total,
        totalReferrals: referralCount.count,
      },
      revenueByMonth: (revenueByMonth as any[]).reverse(),
      usersByMonth: (usersByMonth as any[]).reverse(),
      chainsBreakdown: (chainsBreakdown as any[]),
    };
  }),

  // ── Admin: Airdrops CRUD ──
  airdrops: router({
    // List all (including disabled)
    list: adminProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        disabled: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const conditions = [];
        if (input?.status) conditions.push(eq(schema.airdrops.status, input.status));
        if (input?.disabled !== undefined) conditions.push(eq(schema.airdrops.disabled, input.disabled));
        if (input?.search) {
          conditions.push(or(
            like(schema.airdrops.name, `%${input.search}%`),
            like(schema.airdrops.protocol, `%${input.search}%`)
          ));
        }
        return await db.select().from(schema.airdrops)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(schema.airdrops.createdAt));
      }),

    // Get one with tasks
    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const [airdrop] = await db.select().from(schema.airdrops).where(eq(schema.airdrops.id, input.id));
        if (!airdrop) return null;
        const airdropTasks = await db.select().from(schema.tasks)
          .where(eq(schema.tasks.airdropId, input.id))
          .orderBy(schema.tasks.step);
        return { ...airdrop, tasks: airdropTasks };
      }),

    // Create airdrop
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        protocol: z.string().min(1),
        chain: z.string().min(1),
        status: z.enum(['upcoming', 'active', 'ended']).default('upcoming'),
        description: z.string().min(1),
        guide: z.string().optional(),
        rewardEstimate: z.string().optional(),
        difficulty: z.enum(['簡單', '中等', '困難']).default('中等'),
        source: z.string().optional(),
        sourceUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        tasks: z.array(z.object({
          step: z.number(),
          instruction: z.string(),
          type: z.enum(['link', 'tx', 'social']).default('link'),
          url: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { tasks: inputTasks, ...airdropData } = input;
        const [airdrop] = await db.insert(schema.airdrops)
          .values({ ...airdropData, taskCount: inputTasks?.length || 0 })
          .returning();

        if (inputTasks?.length) {
          await db.insert(schema.tasks).values(
            inputTasks.map(t => ({ ...t, airdropId: airdrop.id }))
          );
        }
        return airdrop;
      }),

    // Update airdrop
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        protocol: z.string().optional(),
        chain: z.string().optional(),
        status: z.enum(['upcoming', 'active', 'ended']).optional(),
        description: z.string().optional(),
        guide: z.string().optional(),
        rewardEstimate: z.string().optional(),
        difficulty: z.enum(['簡單', '中等', '困難']).optional(),
        source: z.string().optional(),
        sourceUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        disabled: z.number().optional(),
        taskCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const [updated] = await db.update(schema.airdrops)
          .set(data).where(eq(schema.airdrops.id, id)).returning();
        return updated;
      }),

    // Delete airdrop
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(schema.tasks).where(eq(schema.tasks.airdropId, input.id));
        await db.delete(schema.airdrops).where(eq(schema.airdrops.id, input.id));
        return { ok: true };
      }),

    // Regenerate AI summary
    regenSummary: adminProcedure
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
        await db.update(schema.airdrops).set({ guide: summary }).where(eq(schema.airdrops.id, input.id));
        return { summary };
      }),
  }),

  // ── Admin: Tasks CRUD ──
  tasks: router({
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        step: z.number().optional(),
        instruction: z.string().optional(),
        type: z.enum(['link', 'tx', 'social']).optional(),
        url: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const [updated] = await db.update(schema.tasks).set(data).where(eq(schema.tasks.id, id)).returning();
        return updated;
      }),

    create: adminProcedure
      .input(z.object({
        airdropId: z.number(),
        step: z.number(),
        instruction: z.string(),
        type: z.enum(['link', 'tx', 'social']).default('link'),
        url: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const [task] = await db.insert(schema.tasks).values(input).returning();
        // Update task count
        const [count] = await db.select({ count: sql<number>`count(*)` }).from(schema.tasks).where(eq(schema.tasks.airdropId, input.airdropId));
        await db.update(schema.airdrops).set({ taskCount: count.count }).where(eq(schema.airdrops.id, input.airdropId));
        return task;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, input.id));
        if (!task) throw new Error('Task not found');
        await db.delete(schema.tasks).where(eq(schema.tasks.id, input.id));
        // Update task count
        const [count] = await db.select({ count: sql<number>`count(*)` }).from(schema.tasks).where(eq(schema.tasks.airdropId, task.airdropId));
        await db.update(schema.airdrops).set({ taskCount: count.count }).where(eq(schema.airdrops.id, task.airdropId));
        return { ok: true };
      }),
  }),

  // ── Admin: Users management ──
  users: router({
    list: adminProcedure
      .input(z.object({
        search: z.string().optional(),
        tier: z.string().optional(),
        limit: z.number().default(50),
      }).optional())
      .query(async ({ input }) => {
        const conditions = [];
        if (input?.tier) conditions.push(eq(schema.users.tier, input.tier));
        if (input?.search) {
          conditions.push(or(
            like(schema.users.address, `%${input.search}%`),
            like(schema.users.email, `%${input.search}%`)
          ));
        }
        return await db.select().from(schema.users)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(schema.users.createdAt))
          .limit(input?.limit || 50);
      }),

    // Get user with details
    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, input.id));
        if (!user) return null;
        const userPayments = await db.select().from(schema.payments)
          .where(eq(schema.payments.userId, input.id))
          .orderBy(desc(schema.payments.createdAt));
        const userReferrals = await db.select().from(schema.referrals)
          .where(eq(schema.referrals.referrerId, input.id));
        return { ...user, payments: userPayments, referralCount: userReferrals.length };
      }),

    // Update user (tier up/downgrade, etc.)
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        tier: z.enum(['free', 'vip']).optional(),
        email: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const [updated] = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning();
        return updated;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(schema.referrals).where(or(
          eq(schema.referrals.referrerId, input.id),
          eq(schema.referrals.refereeId, input.id)
        ));
        await db.delete(schema.payments).where(eq(schema.payments.userId, input.id));
        await db.delete(schema.users).where(eq(schema.users.id, input.id));
        return { ok: true };
      }),
  }),

  // ── Admin: Payments management ──
  payments: router({
    list: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
      }).optional())
      .query(async ({ input }) => {
        const conditions = [];
        if (input?.status) conditions.push(eq(schema.payments.status, input.status));
        return await db.select().from(schema.payments)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(schema.payments.createdAt))
          .limit(input?.limit || 50);
      }),

    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.number().positive(),
        currency: z.string().default('USDC'),
        txHash: z.string().optional(),
        status: z.enum(['pending', 'confirmed', 'failed']).default('confirmed'),
        tierStart: z.string().optional(),
        tierEnd: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const [payment] = await db.insert(schema.payments).values(input).returning();
        if (input.status === 'confirmed') {
          await db.update(schema.users).set({ tier: 'vip' }).where(eq(schema.users.id, input.userId));
          await creditReferralCommission(input.userId, input.amount);
        }
        return payment;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'failed']).optional(),
        txHash: z.string().optional(),
        amount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, id));
        if (!payment) throw new Error('Payment not found');
        const [updated] = await db.update(schema.payments).set(data).where(eq(schema.payments.id, id)).returning();
        // Update user tier based on payment confirmation
        if (data.status === 'confirmed') {
          await db.update(schema.users).set({ tier: 'vip' }).where(eq(schema.users.id, payment.userId));
          await creditReferralCommission(payment.userId, payment.amount);
        }
        return updated;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.delete(schema.payments).where(eq(schema.payments.id, input.id));
        return { ok: true };
      }),
  }),

  // ── Admin: Referrals ──
  referrals: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ input }) => {
        return await db.select().from(schema.referrals)
          .orderBy(desc(schema.referrals.createdAt))
          .limit(input?.limit || 50);
      }),
  }),
});

// ═══════════════════════════════════════════════════════════
// ─── CHAIN ROUTER — On-chain verification ───
// ═══════════════════════════════════════════════════════════

const chainRouter = router({
  /** Health check for RPC connectivity */
  health: publicProcedure.query(async () => {
    return await rpcHealthCheck();
  }),

  /** Verify a transaction on-chain */
  verifyTx: publicProcedure
    .input(z.object({
      txHash: z.string(),
      chainId: z.number().default(137),
    }))
    .query(async ({ input }) => {
      return await verifyTransaction(input.txHash, input.chainId);
    }),

  /** Get native token balance for an address */
  balance: publicProcedure
    .input(z.object({
      address: z.string(),
      chainId: z.number().default(137),
    }))
    .query(async ({ input }) => {
      return await getNativeBalance(input.address, input.chainId);
    }),

  /** Verify airdrop tasks for a wallet address */
  verifyTasks: publicProcedure
    .input(z.object({
      address: z.string(),
      tasks: z.array(z.object({
        id: z.number(),
        instruction: z.string(),
        type: z.enum(['link', 'tx', 'social']),
        url: z.string().optional(),
      })),
      chainId: z.number().default(137),
    }))
    .mutation(async ({ input }) => {
      return await verifyAirdropTasks(input.address, input.tasks as any, input.chainId);
    }),
});

// ─── App router ───
const appRouter = router({
  airdrops: airdropsRouter,
  users: usersRouter,
  stats: statsRouter,
  admin: adminRouter,
  chain: chainRouter,
  health: publicProcedure.query(() => ({ status: 'ok', timestamp: Date.now() })),
});

export type AppRouter = typeof appRouter;

// Mount tRPC
app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: ({ req }) => createContext(req),
}));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../dist/public'));
  app.get('*', (_, res) => {
    res.sendFile('../dist/public/index.html', { root: '.' });
  });
} else {
  app.get('/', (_, res) => {
    res.json({ message: '🪂 DropHunter API', trpc: '/api/trpc', admin: 'pass x-admin-key header' });
  });
}

app.listen(PORT, () => {
  console.log(`🪂 DropHunter running on http://localhost:${PORT}`);
});
