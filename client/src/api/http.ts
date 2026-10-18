export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type QueryParams = Record<string, string | number | null | undefined>;

export async function getJson<T>(path: string, params: QueryParams, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const queryString = query.toString();

  const response = await fetch(queryString ? `${path}?${queryString}` : path, { signal });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, body?.error ?? `Request failed (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}
