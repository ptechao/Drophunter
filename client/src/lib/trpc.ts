import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/src/index';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  url: '/api/trpc',
});
