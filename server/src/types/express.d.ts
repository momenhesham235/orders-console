import type { User } from "../auth/users.repository.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth; always present in handlers mounted after it. */
      user?: User;
    }
  }
}

export {};
