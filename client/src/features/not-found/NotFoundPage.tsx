import { StateMessage } from "../../components/StateMessage.tsx";
import { ROUTES } from "../../lib/routes.ts";

export function NotFoundPage() {
  return (
    <main className="app">
      <StateMessage
        icon="question"
        title="Page not found"
        description={
          <>
            There is nothing at <code>{window.location.pathname}</code>.
          </>
        }
        action={
          <a className="button-primary button-link" href={ROUTES.orders}>
            Go to orders
          </a>
        }
      />
    </main>
  );
}
