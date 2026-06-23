import { getAdminKey } from './adminAuth';

const BASE = '/api/trpc';

/** Call a tRPC query (GET) */
export async function adminQuery(path: string, input: any = {}): Promise<any> {
  const url = new URL(`${BASE}/${path}`, window.location.origin);
  const encoded = encodeURIComponent(JSON.stringify(input));
  url.searchParams.set('input', encoded);
  const res = await fetch(url.toString(), {
    headers: { 'x-admin-key': getAdminKey() || '' },
  });
  const json = await res.json();
  return json?.result?.data;
}

/** Call a tRPC mutation (POST) */
export async function adminMutate(path: string, input: any = {}): Promise<any> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': getAdminKey() || '',
    },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (json?.error) throw new Error(json.error.message);
  return json?.result?.data;
}

/** Check if admin is authenticated */
export async function adminCheck(): Promise<boolean> {
  try {
    const data = await adminQuery('admin.check');
    return data?.ok === true;
  } catch {
    return false;
  }
}
