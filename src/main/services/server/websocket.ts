import { WebSocket, WebSocketServer } from "ws";

export class CustomWebSocketServer extends WebSocketServer {
  private _mappedClients = new Map<string, WebSocket>();

  public addClient(id: string, client: WebSocket) {
    this._mappedClients.set(id, client);
  }

  public removeClient(id: string) {
    this._mappedClients.delete(id);
  }

  broadcast<T>(data: T) {
    if (this._mappedClients.size === 0) return;
    const payload = JSON.stringify(data);

    for (const client of this._mappedClients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        if (client.bufferedAmount > 1024 * 1024) {
          continue;
        }
        client.send(payload);
      }
    }
  }

  // Whether the client got the data.
  sendToClient(clientId: string, data: unknown): boolean {
    const client = this._mappedClients.get(clientId);

    if (client && client.readyState === WebSocket.OPEN) {
      if (client.bufferedAmount > 1024 * 1024) {
        return false;
      }
      client.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  closeAll() {
    for (const client of this._mappedClients.values()) {
      client.close();
    }
    this.close();
  }
}
