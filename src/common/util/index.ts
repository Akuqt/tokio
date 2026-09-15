export * from "./constants";
export * from "./samples";

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

interface TaskQueueOptions {
  maxQueueLength?: number;
  gapTime?: number;
}

type Task = () => void | Promise<void>;

export class TaskQueue {
  private queue: Task[] = [];
  private isProcessing: boolean = false;

  public maxQueueLength: number;
  public gapTime: number;

  constructor() {
    this.maxQueueLength = Infinity;
    this.gapTime = 0;
  }

  public setQueueOptions(options: TaskQueueOptions) {
    this.maxQueueLength = options.maxQueueLength ?? Infinity;
    this.gapTime = options.gapTime ?? 0;
  }

  public enqueue(task: Task): boolean {
    if (this.queue.length >= this.maxQueueLength) {
      console.warn("TaskQueue: Max queue length reached. Dropping task.");
      return false;
    }

    this.queue.push(task);
    this.start();

    return true;
  }

  public start() {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  public stop() {
    this.queue = [];
    this.isProcessing = false;
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0 && this.isProcessing) {
      const task = this.queue.shift();

      if (task) {
        try {
          await task();
        } catch (error) {
          console.error("TaskQueue: Error executing task", error);
        }
      }

      if (this.queue.length > 0 && this.gapTime > 0 && this.isProcessing) {
        await delay(this.gapTime * 1000);
      }
    }

    this.isProcessing = false;
  }
}
