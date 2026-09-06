import { randomBytes, randomUUID } from "node:crypto";
import {
  preferenceKeys,
  Preferences,
  PublicRoomState,
  Room,
  RoomUser,
} from "./types.js";

const rooms = new Map<string, Room>();

const emptyPreferences = (): Preferences => ({
  affordability: 0,
  safety: 0,
  nature: 0,
  temperature: 0,
  humidity: 0,
  mountains: 0,
  density: 0,
  jobs: 0,
  coast: 0,
  politics: 0,
  healthcare: 0,
  schools: 0,
  weatherSeverity: 0,
});

function generateRoomCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (;;) {
    const bytes = randomBytes(4);

    const code = Array.from(bytes)
      .map((byte) => characters[byte % characters.length])
      .join("");

    if (!rooms.has(code)) {
      return code;
    }
  }
}

export function createUser(
  name: string,
  icon: string,
): RoomUser {
  return {
    id: randomUUID(),
    name,
    icon,
    preferences: emptyPreferences(),
  };
}

export function createRoom(user: RoomUser): Room {
  const room: Room = {
    code: generateRoomCode(),
    hostId: user.id,
    status: "lobby",
    users: new Map([[user.id, user]]),
  };

  rooms.set(room.code, room);

  return room;
}

export function joinRoom(
  roomCode: string,
  user: RoomUser,
): Room | null {
  const room = rooms.get(roomCode);

  if (!room) {
    return null;
  }

  room.users.set(user.id, user);

  return room;
}

export function updateUserPreferences(
  roomCode: string,
  userId: string,
  preferences: Preferences,
): boolean {
  const room = rooms.get(roomCode);
  const user = room?.users.get(userId);

  if (!room || !user) {
    return false;
  }

  user.preferences = { ...preferences };

  return true;
}

export function leaveRoom(
  roomCode: string,
  userId: string,
): Room | null {
  const room = rooms.get(roomCode);

  if (!room) {
    return null;
  }

  room.users.delete(userId);

  if (room.users.size === 0) {
    rooms.delete(roomCode);
    return null;
  }

  return room;
}

function getCombinedPreferences(
  room: Room,
): Preferences {
  const combined = emptyPreferences();
  const users = Array.from(room.users.values());

  if (users.length === 0) {
    return combined;
  }

  for (const key of preferenceKeys) {
    const total = users.reduce(
      (sum, user) => sum + user.preferences[key],
      0,
    );

    combined[key] = total / users.length;
  }

  return combined;
}

export function getPublicRoomState(
  room: Room,
): PublicRoomState {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    users: Array.from(room.users.values()).map((user) => ({
      id: user.id,
      name: user.name,
      icon: user.icon,
      preferences: { ...user.preferences },
    })),
    combinedPreferences: getCombinedPreferences(room),
  };
}

export function startRoom(
  roomCode: string,
  userId: string,
): Room | null {
  const room = rooms.get(roomCode);

  if (!room || room.hostId !== userId) {
    return null;
  }

  room.status = "active";

  return room;
}

export function getRoom(roomCode: string): Room | null {
  return rooms.get(roomCode) ?? null;
}