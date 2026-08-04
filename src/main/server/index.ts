import {
  LoggerOptions,
  OverlayApp,
  TIKTOK_EVENTS,
  TikTokEventMap,
  WSRoom,
} from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import express, { Express, Router } from "express";
import { Server as HttpServer } from "http";
import { randomUUID } from "node:crypto";
import { WSROOMS } from "./util";
import { RoomWebSocketServer } from "./websocket";

export class OverlayServer {
  private app: Express;
  private server: HttpServer | null = null;
  private wss: RoomWebSocketServer | null = null;
  private dynamicRouter: Router;
  private _logSettings: LoggerOptions;
  private _port: number;
  public activeApps: OverlayApp[] = [];

  constructor() {
    this.app = express();
    this.dynamicRouter = express.Router();
    this._logSettings = { file: false, path: "" };
    this._port = 6767;

    this.app.use((req, res, next) => {
      this.dynamicRouter(req, res, next);
    });
  }

  private rebuildRoutes() {
    const newRouter = express.Router();

    this.activeApps.forEach((app) => {
      newRouter.use(app.route, express.static(app.path));
    });

    this.dynamicRouter = newRouter;
  }

  private multiBroadcast<T>(rooms: WSRoom[], data: T) {
    if (!this.wss) return;
    for (const room of rooms) {
      this.wss.broadcastToRoom(room, data);
    }
  }

  public setLogOptions(options: LoggerOptions) {
    this._logSettings = options;
  }

  public start(): Promise<{ success: boolean; message: string }> {
    if (this.server)
      return Promise.resolve({
        success: false,
        message: "Server already running.",
      });

    return new Promise((resolve) => {
      this.server = this.app.listen(this._port, "0.0.0.0", () => {
        this.wss = new RoomWebSocketServer({ server: this.server! });
        this.wss.on("connection", (ws, req) => {
          const urlPath = (req.url?.split("/")[1] ?? "") as WSRoom;
          if (!WSROOMS.includes(urlPath)) return;
          this.wss?.joinRoom(urlPath, ws);
          Logger.info(
            `<WebSocket> New client connected to ${urlPath} events.`,
            this._logSettings,
          );
          ws.send(
            JSON.stringify({
              success: true,
              message: `Connected to ${urlPath} events.`,
            }),
          );
        });
        Logger.success(
          `<Server> Server running on port ${this._port}`,
          this._logSettings,
        );
        resolve({
          success: true,
          message: `Server running on port ${this._port}`,
        });
      });

      this.server.on("error", (err) => {
        this.server = null;
        Logger.error(
          `<Server> Unable to start server on port ${this._port} -- ${formatError(err)}`,
          this._logSettings,
        );
        resolve({ success: false, message: err.message });
      });
    });
  }

  public stop(): void {
    if (this.wss) {
      this.wss.closeAll();
      this.wss = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  public updatePort(port: number) {
    if (port === this._port) return;
    this._port = port;
    this.stop();
    setTimeout(() => {
      this.start();
    }, 500);
  }

  public addOverlayApp(overlayApp: Omit<OverlayApp, "id">): OverlayApp[] {
    const safeRoute = overlayApp.route.startsWith("/")
      ? overlayApp.route
      : `/${overlayApp.route}`;

    const id = randomUUID();

    this.activeApps.push({ ...overlayApp, route: safeRoute, id });

    this.rebuildRoutes();

    return this.activeApps;
  }

  public removeOverlayApp(id: string): OverlayApp[] {
    this.activeApps = this.activeApps.filter((a) => a.id !== id);

    this.rebuildRoutes();

    return this.activeApps;
  }

  public broadcast<T extends TIKTOK_EVENTS>(type: T, data: TikTokEventMap[T]) {
    switch (type) {
      case TIKTOK_EVENTS.CHAT:
        this.multiBroadcast(["CHAT", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.LIKE:
        this.multiBroadcast(["LIKE", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.GIFT:
        this.multiBroadcast(["GIFT", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.FOLLOW:
        this.multiBroadcast(["FOLLOW", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.SHARE:
        this.multiBroadcast(["SHARE", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.ENVELOPE:
        this.multiBroadcast(["ENVELOPE", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.SUPER_FAN:
        this.multiBroadcast(["SUPER_FAN", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.SUPER_FAN_BOX:
        this.multiBroadcast(["SUPER_FAN_BOX", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.MEMBER_JOIN:
        this.multiBroadcast(["MEMBER_JOIN", "GLOBAL"], data);
        break;
      case TIKTOK_EVENTS.SUPER_FAN_JOIN:
        this.multiBroadcast(["SUPER_FAN_JOIN", "GLOBAL"], data);
        break;
      default:
        Logger.warn(
          `<Server> Unknown Broadcast Event ${type}`,
          this._logSettings,
        );
        break;
    }
  }
}
