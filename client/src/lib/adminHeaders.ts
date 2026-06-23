import { trpc } from '../lib/trpc';
import { getAdminKey } from '../lib/adminAuth';

/** Get headers with admin key for tRPC calls */
export function adminHeaders() {
  const key = getAdminKey();
  return key ? { 'x-admin-key': key } : {};
}

/** Custom fetcher that adds admin header */
export function adminFetcher(url: string, options?: RequestInit) {
  const headers = new Headers(options?.headers);
  const key = getAdminKey();
  if (key) headers.set('x-admin-key', key);
  headers.set('content-type', 'application/json');
  return fetch(url, { ...options, headers });
}
