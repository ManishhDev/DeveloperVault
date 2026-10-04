import type { ApiErrorBody, ApiErrorDetail } from '@devvault/shared';

const BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api`;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: ApiErrorDetail[] = [],
  ) {
    super(message);
  }
}

type Options = Omit<RequestInit, 'body'> & { json?: unknown };

export async function api<T>(path: string, { json, headers, ...init }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...(json !== undefined && { 'content-type': 'application/json' }), ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Is the API running?');
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'INTERNAL_ERROR',
      error?.message ?? `Request failed (${res.status})`,
      error?.details,
    );
  }
  return body as T;
}
