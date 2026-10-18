const moneyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR" });
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function formatMoney(cents: number): string {
  return moneyFormat.format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return dateFormat.format(new Date(iso));
}
