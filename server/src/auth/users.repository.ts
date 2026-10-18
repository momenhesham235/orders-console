import { db } from "../db/connection.js";

export type Role = "admin" | "agent";

export interface User {
  id: number;
  email: string;
  role: Role;
}

interface UserWithPassword extends User {
  passwordHash: string;
}

// email is COLLATE NOCASE in the schema, so the lookup is case-insensitive.
export function findUserByEmail(email: string): UserWithPassword | undefined {
  return db
    .prepare("SELECT id, email, role, password_hash AS passwordHash FROM users WHERE email = ?")
    .get(email) as UserWithPassword | undefined;
}

export function findUserById(id: number): User | undefined {
  return db.prepare("SELECT id, email, role FROM users WHERE id = ?").get(id) as User | undefined;
}
