/**
 * Typed API client for the Express backend.
 *
 * Requests use `credentials: 'include'` so the browser sends the NextAuth
 * session cookie. That cookie is scoped to **this** origin only — it is not
 * sent on cross-origin fetches to a separate API host. Deployments that split
 * the panel (e.g. Vercel) and API (e.g. Render) should set `NEXT_PUBLIC_API_URL`
 * to a same-origin path like `/api/v1` and configure `BACKEND_PROXY_ORIGIN`
 * in `next.config.mjs` rewrites so `/api/v1/*` is forwarded to Express.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code?: string; message: string };
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  skipContentType = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (!skipContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    throw new ApiError(
      res.status,
      body.error?.code,
      body.error?.message ?? `Request failed: ${res.status}`,
    );
  }

  return body.data as T;
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'DELETE' }),

  /** Multipart/form-data upload — do NOT set Content-Type manually (browser sets boundary). */
  upload: <T>(path: string, formData: FormData, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'POST', body: formData }, true),

  ApiError,
};
