export * from "./constants";

export function formatError(error: unknown) {
  if (!(error instanceof Error)) return "unknown";
  const message = error.message || "<message?>";
  const cause =
    error.cause instanceof Error ? error.cause : new Error("<cause?>");
  return `message: ${message} -- cause: ${cause.message}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
}
