import { ApiError, getJson, postJson } from "./http.ts";

export type Role = "admin" | "agent";

export interface User {
  id: number;
  email: string;
  role: Role;
}

/** The signed-in user, or null when there is no valid session. */
export async function fetchCurrentUser(signal: AbortSignal): Promise<User | null> {
  try {
    const { user } = await getJson<{ user: User }>("/api/auth/me", {}, signal);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function login(email: string, password: string): Promise<User> {
  const { user } = await postJson<{ user: User }>("/api/auth/login", { email, password });
  return user;
}

export function logout(): Promise<void> {
  return postJson<void>("/api/auth/logout");
}
