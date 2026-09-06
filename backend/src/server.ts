import { WebSocket, WebSocketServer } from "ws";
import { parseClientMessage } from "./messages.js";
import {
  createRoom,
  createUser,
  getPublicRoomState,
  getRoom,
  joinRoom,
  leaveRoom,
  startRoom,
  updateUserPreferences,
} from "./rooms.js";
import { Room, ServerMessage } from "./types.js";

const PORT = 3000;

type ClientSession = {
  userId: string | null;
  roomCode: string | null;
};

const wss = new WebSocketServer({
  port: PORT,
});

const sessions = new Map<WebSocket, ClientSession>();

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function sendError(socket: WebSocket, message: string) {
  send(socket, {
    type: "error",
    message,
  });
}

function broadcastRoom(room: Room) {
  const message: ServerMessage = {
    type: "room_state",
    room: getPublicRoomState(room),
  };

  for (const [socket, session] of sessions) {
    if (session.roomCode === room.code) {
      send(socket, message);
    }
  }
}

function removeClientFromRoom(socket: WebSocket) {
  const session = sessions.get(socket);

  if (!session?.roomCode || !session.userId) {
    return;
  }

  const room = leaveRoom(
    session.roomCode,
    session.userId,
  );

  session.roomCode = null;
  session.userId = null;

  if (room) {
    broadcastRoom(room);
  }
}

wss.on("connection", (socket) => {
  console.log("Client connected");

  sessions.set(socket, {
    userId: null,
    roomCode: null,
  });

  socket.on("message", (data) => {
    const message = parseClientMessage(data.toString());

    if (!message) {
      sendError(socket, "Invalid message.");
      return;
    }

    const session = sessions.get(socket);

    if (!session) {
      return;
    }

    switch (message.type) {
      case "create_room": {
        if (session.roomCode) {
          sendError(socket, "You are already in a room.");
          return;
        }

        const user = createUser(message.name, message.icon);
        const room = createRoom(user);

        session.userId = user.id;
        session.roomCode = room.code;

        send(socket, {
          type: "room_joined",
          userId: user.id,
          room: getPublicRoomState(room),
        });

        console.log(
          `${user.name} created room ${room.code}`,
        );

        break;
      }

      case "join_room": {
        if (session.roomCode) {
          sendError(socket, "You are already in a room.");
          return;
        }

        const user = createUser(message.name, message.icon);
        const room = joinRoom(message.roomCode, user);

        if (!room) {
          sendError(socket, "Room not found.");
          return;
        }

        session.userId = user.id;
        session.roomCode = room.code;

        send(socket, {
          type: "room_joined",
          userId: user.id,
          room: getPublicRoomState(room),
        });

        broadcastRoom(room);

        console.log(
          `${user.name} joined room ${room.code}`,
        );

        break;
      }

      case "update_preferences": {
        if (!session.roomCode || !session.userId) {
          sendError(socket, "You are not in a room.");
          return;
        }

        const updated = updateUserPreferences(
          session.roomCode,
          session.userId,
          message.preferences,
        );

        if (!updated) {
          sendError(socket, "Unable to update preferences.");
          return;
        }

        const room = getRoom(session.roomCode);

        if (room) {
          broadcastRoom(room);
        }

        break;
      }

      case "start_room": {
        if (!session.roomCode || !session.userId) {
          sendError(socket, "You are not in a room.");
          return;
        }

        const room = startRoom(
          session.roomCode,
          session.userId,
        );

        if (!room) {
          sendError(socket, "Only the host can start the room.");
          return;
        }

        broadcastRoom(room);
        break;
      }

      case "leave_room": {
        removeClientFromRoom(socket);

        send(socket, {
          type: "left_room",
        });

        break;
      }
    }
  });

  socket.on("close", () => {
    removeClientFromRoom(socket);
    sessions.delete(socket);

    console.log("Client disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log(`WebSocket server running on port ${PORT}`);