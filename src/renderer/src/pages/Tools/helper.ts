// Result of the last test events sent to a test overlay
export type TestStatus = "sent" | "no-client";

export const STATUS_LABELS: Record<TestStatus, string> = {
  sent: "Test events sent.",
  "no-client": "No overlay connected with this ID.",
};
