import { WebSocket, WebSocketServer } from "ws";

export class CustomWebSocketServer extends WebSocketServer {
  // Several instances of an overlay (OBS sources, browser tabs) share its id.
  private _mappedClients = new Map<string, Set<WebSocket>>();

  public addClient(id: string, client: WebSocket) {
    const clients = this._mappedClients.get(id);
    if (clients) clients.add(client);
    else this._mappedClients.set(id, new Set([client]));
  }

  public removeClient(id: string, client: WebSocket) {
    const clients = this._mappedClients.get(id);
    if (!clients) return;
    clients.delete(client);
    if (clients.size === 0) this._mappedClients.delete(id);
  }

  broadcast(data: unknown) {
    if (this._mappedClients.size === 0) return;
    const payload = JSON.stringify(data);

    for (const clients of this._mappedClients.values()) {
      for (const client of clients) this._send(client, payload);
    }
  }

  // Whether any client with the id got the data.
  sendToClient(clientId: string, data: unknown): boolean {
    const clients = this._mappedClients.get(clientId);
    if (!clients) return false;

    const payload = JSON.stringify(data);
    let sent = false;
    for (const client of clients) {
      if (this._send(client, payload)) sent = true;
    }
    return sent;
  }

  closeAll() {
    for (const clients of this._mappedClients.values()) {
      for (const client of clients) client.close();
    }
    this.close();
  }

  private _send(client: WebSocket, payload: string): boolean {
    if (client.readyState !== WebSocket.OPEN) return false;
    if (client.bufferedAmount > 1024 * 1024) return false;
    client.send(payload);
    return true;
  }
}
