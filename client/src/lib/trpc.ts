import { createTRPCReact, httpBatchLink } from '@trpc/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trpcReact: any = createTRPCReact<any>();
export const trpc: any = trpcReact;
export const trpcClient: any = trpcReact.createClient({
  links: [httpBatchLink({ url: '/api/trpc' })],
});
