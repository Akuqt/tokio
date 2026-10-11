import { OverlayMetadata } from "@/common/schemas";
import { OverlayApp, TOKIO_EVENTS, TokioEventMap } from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import express, { Express, Router } from "express";
import { randomUUID } from "node:crypto";
import { Server as HttpServer } from "node:http";
import { TikTokConnectorService } from "../connector";
import { Service } from "../shared";
import { CustomWebSocketServer } from "./websocket";

type BoundHandler = <K extends TOKIO_EVENTS>(data: TokioEventMap[K]) => void;

export class ServerService extends Service {
  private _app: Express;
  private _server: HttpServer | null = null;
  private _wss: CustomWebSocketServer | null = null;
  private _dynamicRouter: Router;
  private _port: number;
  private _activeOverlays: (OverlayMetadata & { id: string; path: string })[] =
    [];
  private _boundEvents: {
    event: TOKIO_EVENTS;
    handler: BoundHandler;
  }[] = [];

  constructor() {
    super();
    this._app = express();
    this._dynamicRouter = express.Router();
    this._port = 37891;

    this._app.use((req, res, next) => {
      this._dynamicRouter(req, res, next);
    });
  }

  private rebuildRoutes() {
    const newRouter = express.Router();
    this._activeOverlays.forEach((overlay) => {
      const route = "/" + overlay.id;
      newRouter.use(route, (req, res, next) => {
        if (req.originalUrl === route) {
          return res.redirect(route + "/");
        }
        next();
      });
      newRouter.use(route, express.static(overlay.path));
    });
    this._dynamicRouter = newRouter;
  }

  public setLogFile(logFile: string) {
    this._logFile = logFile;
  }

  public start(): Promise<{ success: boolean; message: string }> {
    if (this._server)
      return Promise.resolve({
        success: false,
        message: "Server already running.",
      });

    return new Promise((resolve) => {
      this._server = this._app.listen(this._port, "0.0.0.0", () => {
        this._wss = new CustomWebSocketServer({ server: this._server! });
        this._wss.on("connection", (client, req) => {
          const url = new URL(req.url || "/", "http://localhost:37891");

          const clientId = url.searchParams.get("id") || randomUUID();

          this._wss?.addClient(clientId, client);
          Logger.info(
            `<WebSocket> New client connected: ${clientId}`,
            this._logFile,
          );

          client.on("close", () => {
            this._wss?.removeClient(clientId);
            Logger.info(
              `<WebSocket> Client disconnected: ${clientId}`,
              this._logFile,
            );
          });
        });
        Logger.success(
          `<Server> Server running on port ${this._port}`,
          this._logFile,
        );
        this.rebuildRoutes();
        resolve({
          success: true,
          message: `Server running on port ${this._port}`,
        });
      });

      this._server.on("error", (err) => {
        this._server = null;
        Logger.error(
          `<Server> Unable to start server on port ${this._port} -- ${formatError(err)}`,
          this._logFile,
        );
        resolve({ success: false, message: err.message });
      });
    });
  }

  public stop(): void {
    if (this._wss) {
      this._wss.closeAll();
      this._wss = null;
      Logger.info(`<WebSocket> WebSocket server stopped.`, this._logFile);
    }
    if (this._server) {
      this._server.close();
      this._server = null;
      Logger.info(`<Server> Server stopped.`, this._logFile);
    }
  }

  public async toggleServer(value: boolean): Promise<boolean> {
    if (value) {
      const result = await this.start();
      return result.success;
    } else {
      this.stop();
      return true;
    }
  }

  public addOverlayApp(overlayApp: OverlayApp, rebuild: boolean = true): void {
    this._activeOverlays.push(overlayApp);
    if (rebuild) this.rebuildRoutes();
  }

  public getOverlayApps(): OverlayApp[] {
    return this._activeOverlays;
  }

  public removeOverlayApp(id: string) {
    this._activeOverlays = this._activeOverlays.filter((a) => a.id !== id);
    this.rebuildRoutes();
  }

  public initEvents(connectorService: TikTokConnectorService) {
    if (!connectorService) {
      throw new Error("Connector service not defined.");
    }
    Object.values(TOKIO_EVENTS).forEach((event) => {
      const handler: BoundHandler = (data) => this.broadcast(event, data);
      connectorService.on(event, handler);
      this._boundEvents.push({ event, handler });
    });
  }

  public cleanupEvents(connectorService: TikTokConnectorService) {
    this._boundEvents.forEach(({ event, handler }) => {
      connectorService.off(event, handler);
    });
    this._boundEvents = [];
  }

  public sendToClient(id: string, payload: any) {
    if (this._wss) {
      this._wss.sendToClient(id, payload);
    }
  }

  private broadcast<T extends TOKIO_EVENTS>(type: T, data: TokioEventMap[T]) {
    if (this._wss) {
      this._wss.broadcast({ type, data });
    }
  }
}
