import type { Criterion } from "../data/states";

export type Preferences = Record<Criterion, number>;

export type RoomUser = {
  id: string;
  name: string;
  preferences: Preferences;
};

export type RoomState = {
  code: string;
  users: RoomUser[];
  combinedPreferences: Preferences;
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