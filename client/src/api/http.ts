export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type QueryParams = Record<string, string | number | null | undefined>;

// The session cookie rides along automatically: the API is same-origin (Vite proxies /api).
async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, body?.error ?? `Request failed (HTTP ${response.status})`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export function getJson<T>(path: string, params: QueryParams = {}, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const queryString = query.toString();
  return request<T>(queryString ? `${path}?${queryString}` : path, { signal });
}

export function postJson<T>(
  path: string,
  body?: unknown,
  { headers, signal }: { headers?: Record<string, string>; signal?: AbortSignal } = {},
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
}
