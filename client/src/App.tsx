import { LoginPage } from "./features/auth/LoginPage.tsx";
import { useCurrentUser, useLogout } from "./features/auth/useAuth.ts";
import { OrdersPage } from "./features/orders/OrdersPage.tsx";

export function App() {
  const currentUser = useCurrentUser();
  const logoutMutation = useLogout();

  if (currentUser.isPending) return <p className="app-status">Loading…</p>;

  if (currentUser.isError) {
    return (
      <div className="app-status" role="alert">
        <p>Could not reach the server.</p>
        <button type="button" onClick={() => void currentUser.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const user = currentUser.data;
  if (!user) return <LoginPage />;

  return (
    <main className="app">
      <header className="app-header">
        <h1>Orders Console</h1>
        <div className="session">
          <span className="muted">{user.email}</span>
          <span className="role">{user.role}</span>
          <button type="button" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            Sign out
          </button>
        </div>
      </header>
      <OrdersPage />
    </main>
  );
}
