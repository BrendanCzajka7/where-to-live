import type { Criterion } from "../data/states";

export type Preferences = Record<Criterion, number>;

export type RoomState = {
  code: string;
  hostId: string;
  status: "lobby" | "active";
  users: RoomUser[];
  combinedPreferences: Preferences;
};


export type RoomUser = {
  id: string;
  name: string;
  icon: string;
  preferences: Preferences;
};


export type ServerMessage =
  | {
      type: "room_joined";
      userId: string;
      room: RoomState;
    }
  | {
      type: "room_state";
      room: RoomState;
    }
  | {
      type: "left_room";
    }
  | {
      type: "error";
      message: string;
    };

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "unavailable";