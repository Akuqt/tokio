import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { existsSync } from "fs";
import { createInterface } from "readline";
import config from "../config";
import { SapiRequest, SapiResponse, SapiResponseMap } from "../types";
import { ENCODED_SCRIPT } from "./script";

type Pending = {
  // Response data is trusted to match the request type, see SapiResponseMap.
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

export class SapiHost {
  private _child: ChildProcessWithoutNullStreams | null = null;
  private _pending: Map<number, Pending> = new Map();
  private _nextId = 1;
  private _stderr = "";

  private _resolvePowerShell() {
    return (
      config.POWERSHELL_PATHS.find((p) => existsSync(p)) || "powershell.exe"
    );
  }

  private _spawn() {
    const child = spawn(
      this._resolvePowerShell(),
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        ENCODED_SCRIPT,
      ],
      { windowsHide: true, stdio: "pipe" },
    );

    this._stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      this._stderr = (this._stderr + chunk).slice(-2000);
    });

    createInterface({ input: child.stdout }).on("line", (line) => {
      this._onLine(line);
    });

    child.stdin.on("error", (error) => this._onExit(child, error));
    child.on("error", (error) => this._onExit(child, error));
    child.on("exit", (code) =>
      this._onExit(
        child,
        new Error(
          `SAPI host exited with code ${code}${this._stderr ? ` - ${this._stderr.trim()}` : ""}`,
        ),
      ),
    );

    this._child = child;
    return child;
  }

  private _onLine(line: string) {
    let res: SapiResponse;
    try {
      res = JSON.parse(line);
    } catch {
      return;
    }
    const pending = this._pending.get(res.id);
    if (!pending) return;
    this._pending.delete(res.id);
    clearTimeout(pending.timer);
    if (res.ok) {
      pending.resolve(res.data);
    } else {
      pending.reject(new Error(res.error || "Unknown SAPI error"));
    }
  }

  private _onExit(child: ChildProcessWithoutNullStreams, error: Error) {
    if (this._child !== child) return;
    this._child = null;
    for (const pending of this._pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this._pending.clear();
  }

  public request<K extends SapiRequest["type"]>(
    req: Extract<SapiRequest, { type: K }>,
  ): Promise<SapiResponseMap[K]> {
    const child = this._child ?? this._spawn();
    const id = this._nextId++;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new Error(`SAPI request "${req.type}" timed out`));
        child.kill(); // Stuck host, the next request respawns it.
      }, config.REQUEST_TIMEOUT_MS);

      this._pending.set(id, { resolve, reject, timer });
      child.stdin.write(`${JSON.stringify({ ...req, id })}\n`, "utf8");
    });
  }

  public dispose() {
    const child = this._child;
    if (!child) return;
    this._onExit(child, new Error("SAPI host disposed"));
    child.stdin.end();
    child.kill();
  }
}
