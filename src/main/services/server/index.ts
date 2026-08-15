import {
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
import { TikTokConnectorService } from "../connector";
import { Service } from "../shared";
import { WSROOMS } from "./util";
import { RoomWebSocketServer } from "./websocket";

export class ServerService extends Service {
  private app: Express;
  private server: HttpServer | null = null;
  private wss: RoomWebSocketServer | null = null;
  private dynamicRouter: Router;
  private _port: number;
  public activeApps: OverlayApp[] = [];

  constructor() {
    super();
    this.app = express();
    this.dynamicRouter = express.Router();
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

  public setLogFile(logFile: string) {
    this._logFile = logFile;
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
            this._logFile,
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
          this._logFile,
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
          this._logFile,
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

  public updatePort(port: number, start: boolean) {
    return new Promise<boolean>((res) => {
      if (port === this._port) res(false);
      this._port = port;
      this.stop();
      if (start) {
        setTimeout(async () => {
          const t = await this.start();
          res(t.success);
        }, 500);
      }
      res(true);
    });
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

  public initEvents(connectorService: TikTokConnectorService) {
    if (!connectorService) {
      throw new Error("Connector service not defined.");
    }
    connectorService.on(TIKTOK_EVENTS.CHAT, (data) => {
      this.broadcast(TIKTOK_EVENTS.CHAT, data);
    });
    connectorService.on(TIKTOK_EVENTS.LIKE, (data) => {
      this.broadcast(TIKTOK_EVENTS.LIKE, data);
    });
    connectorService.on(TIKTOK_EVENTS.GIFT, (data) => {
      this.broadcast(TIKTOK_EVENTS.GIFT, data);
    });
    connectorService.on(TIKTOK_EVENTS.FOLLOW, (data) => {
      this.broadcast(TIKTOK_EVENTS.FOLLOW, data);
    });
    connectorService.on(TIKTOK_EVENTS.SHARE, (data) => {
      this.broadcast(TIKTOK_EVENTS.SHARE, data);
    });
    connectorService.on(TIKTOK_EVENTS.ENVELOPE, (data) => {
      this.broadcast(TIKTOK_EVENTS.ENVELOPE, data);
    });
    connectorService.on(TIKTOK_EVENTS.SUPER_FAN_BOX, (data) => {
      this.broadcast(TIKTOK_EVENTS.SUPER_FAN_BOX, data);
    });
    connectorService.on(TIKTOK_EVENTS.SUPER_FAN, (data) => {
      this.broadcast(TIKTOK_EVENTS.SUPER_FAN, data);
    });
    connectorService.on(TIKTOK_EVENTS.MEMBER_JOIN, (data) => {
      this.broadcast(TIKTOK_EVENTS.MEMBER_JOIN, data);
    });
    connectorService.on(TIKTOK_EVENTS.SUPER_FAN_JOIN, (data) => {
      this.broadcast(TIKTOK_EVENTS.SUPER_FAN_JOIN, data);
    });
  }

  private broadcast<T extends TIKTOK_EVENTS>(type: T, data: TikTokEventMap[T]) {
    const EVENT_ROOM_MAP: Partial<Record<TIKTOK_EVENTS, WSRoom>> = {
      [TIKTOK_EVENTS.CHAT]: "CHAT",
      [TIKTOK_EVENTS.LIKE]: "LIKE",
      [TIKTOK_EVENTS.GIFT]: "GIFT",
      [TIKTOK_EVENTS.FOLLOW]: "FOLLOW",
      [TIKTOK_EVENTS.SHARE]: "SHARE",
      [TIKTOK_EVENTS.ENVELOPE]: "ENVELOPE",
      [TIKTOK_EVENTS.SUPER_FAN]: "SUPER_FAN",
      [TIKTOK_EVENTS.SUPER_FAN_BOX]: "SUPER_FAN_BOX",
      [TIKTOK_EVENTS.MEMBER_JOIN]: "MEMBER_JOIN",
      [TIKTOK_EVENTS.SUPER_FAN_JOIN]: "SUPER_FAN_JOIN",
    };
    const room = EVENT_ROOM_MAP[type];

    if (room) {
      this.multiBroadcast([room, "GLOBAL"], data);
    } else {
      Logger.warn(`<Server> Unknown Broadcast Event ${type}`, this._logFile);
    }
  }
}
