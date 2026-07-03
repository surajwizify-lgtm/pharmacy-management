export class ApiClientError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/**
 * Thin wrapper around fetch() for our own /api routes from client
 * components. Cookies (the NextAuth session) go along automatically since
 * these are same-origin requests, so there's no token to attach by hand.
 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiClientError(res.status, body?.message ?? res.statusText, body?.errors);
  }
  return body as T;
}
