import { ApiError } from "../api/http.ts";

/** A message an operations agent can act on, instead of "Failed to fetch" or a stack trace. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status >= 500 ? "The server ran into a problem. Please try again in a moment." : error.message;
  }
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "The server took too long to respond. Please try again.";
  }
  // fetch rejects with a TypeError when the request never got a response.
  return "Could not reach the server. Check your connection and try again.";
}
