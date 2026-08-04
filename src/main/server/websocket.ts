import { WSRoom } from "@/common/types";
import { ServerOptions, WebSocket, WebSocketServer } from "ws";
import { WSROOMS } from "./util";

interface RoomWebSocket extends WebSocket {
  rooms?: Set<WSRoom>;
}

export class RoomWebSocketServer extends WebSocketServer {
  public rooms: Map<WSRoom, Set<RoomWebSocket>>;

  constructor(options: ServerOptions) {
    super(options);
    this.rooms = new Map();
    for (const r of WSROOMS) {
      this.rooms.set(r, new Set());
    }
  }

  joinRoom(roomName: WSRoom, ws: RoomWebSocket) {
    if (!WSROOMS.includes(roomName)) return;

    if (roomName)
      if (!this.rooms.has(roomName)) {
        this.rooms.set(roomName, new Set());
      }

    this.rooms.get(roomName)!.add(ws);

    if (!ws.rooms) {
      ws.rooms = new Set();
    }
    ws.rooms.add(roomName);
  }

  leaveRoom(roomName: WSRoom, ws: RoomWebSocket) {
    if (!WSROOMS.includes(roomName)) return;
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }
    if (ws.rooms) {
      ws.rooms.delete(roomName);
    }
  }

  leaveAllRooms(ws: RoomWebSocket) {
    if (ws.rooms) {
      for (const roomName of ws.rooms) {
        this.leaveRoom(roomName, ws);
      }
    }
  }

  broadcastToRoom<T>(
    roomName: WSRoom,
    data: T,
    excludeWs: RoomWebSocket | null = null,
  ) {
    if (!WSROOMS.includes(roomName)) return;
    const room = this.rooms.get(roomName);
    if (!room) return;

    for (const client of room) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ data }));
      }
    }
  }

  broadcastGlobal<T>(data: T, excludeWs: RoomWebSocket | null = null) {
    for (const client of this.clients) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ data }));
      }
    }
  }

  closeAll() {
    for (const client of this.clients) {
      client.close();
    }
    this.close();
  }
}
