import { useLayoutEffect, useState } from "react";
import { StateMessage } from "./components/StateMessage.tsx";
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { useCurrentUser, useLogout } from "./features/auth/useAuth.ts";
import { OrdersPage } from "./features/orders/OrdersPage.tsx";
import { describeError } from "./lib/describeError.ts";
import { redirectUrl, replaceUrl, ROUTES } from "./lib/routes.ts";

export function App() {
  const currentUser = useCurrentUser();
  const logoutMutation = useLogout();
  // Only the path is App's concern; the query string (filters) belongs to OrdersPage.
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const expectedPath =
    currentUser.data === undefined ? null : currentUser.data ? ROUTES.orders : ROUTES.login;

  // Before paint, so a screen never renders under the wrong path: OrdersPage reads its filters
  // from the address bar when it mounts, so the bar must already say /orders?... by then.
  useLayoutEffect(() => {
    if (expectedPath !== null && pathname !== expectedPath) {
      replaceUrl(redirectUrl(expectedPath));
      setPathname(expectedPath);
    }
  }, [expectedPath, pathname]);

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

  // The path is being corrected (see the layout effect above); render nothing for that instant.
  if (pathname !== expectedPath) return null;

  const user = currentUser.data;
  if (!user) return <LoginPage />;

  return (
    <main className="app">
      <header className="app-header">
        <h1>Orders Console</h1>
        <div className="session">
          <span className="muted">{user.email}</span>
          <span className="role">{user.role}</span>
          <button
            type="button"
            className="button-danger-outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Sign out
          </button>
        </div>
      </header>
      <OrdersPage canDelete={user.role === "admin"} />
    </main>
  );
}
