import { StateMessage } from "./components/StateMessage.tsx";
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { useCurrentUser, useLogout } from "./features/auth/useAuth.ts";
import { OrdersPage } from "./features/orders/OrdersPage.tsx";
import { describeError } from "./lib/describeError.ts";

export function App() {
  const currentUser = useCurrentUser();
  const logoutMutation = useLogout();

  if (currentUser.isPending) return <p className="app-status">Loading…</p>;

  if (currentUser.isError) {
    return (
      <main className="app">
        <StateMessage
          tone="danger"
          icon="alert"
          title="Couldn't reach the server"
          description={describeError(currentUser.error)}
          action={
            <button type="button" className="button-primary" onClick={() => void currentUser.refetch()}>
              Try again
            </button>
          }
        />
      </main>
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
