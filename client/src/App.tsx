import { useEffect, useState } from "react";
import { fetchHealth } from "./api/health.ts";

type ApiState = "checking" | "online" | "offline";

export function App() {
  const [apiState, setApiState] = useState<ApiState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetchHealth(controller.signal)
      .then(() => setApiState("online"))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setApiState("offline");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="app">
      <h1>Orders Console</h1>
      <p>
        API status: <strong data-state={apiState}>{apiState}</strong>
      </p>
    </main>
  );
}
