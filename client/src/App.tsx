import { OrdersPage } from "./features/orders/OrdersPage.tsx";

export function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1>Orders Console</h1>
      </header>
      <OrdersPage />
    </main>
  );
}
