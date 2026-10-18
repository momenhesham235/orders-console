import { useState, type FormEvent } from "react";
import { useLogin } from "./useAuth.ts";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ email: email.trim(), password });
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Orders Console</h1>
        <p className="muted">Sign in to continue.</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {loginMutation.isError && (
          <p className="form-error" role="alert">
            {loginMutation.error.message}
          </p>
        )}

        <button type="submit" className="button-primary" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
