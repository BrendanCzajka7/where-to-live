export const preferenceKeys = [
  "affordability",
  "safety",
  "nature",
  "temperature",
  "humidity",
  "mountains",
  "density",
  "jobs",
  "coast",
  "politics",
  "healthcare",
  "schools",
  "weatherSeverity",
] as const;

export type PreferenceKey = (typeof preferenceKeys)[number];

export type Preferences = Record<PreferenceKey, number>;

export type RoomUser = {
  id: string;
  name: string;
  preferences: Preferences;
};

export type Room = {
  code: string;
  users: Map<string, RoomUser>;
};

export type PublicRoomState = {
  code: string;
  users: RoomUser[];
  combinedPreferences: Preferences;
};

export type ClientMessage =
  | {
      type: "create_room";
      name: string;
    }
  | {
      type: "join_room";
      roomCode: string;
      name: string;
    }
  | {
      type: "update_preferences";
      preferences: Preferences;
    }
  | {
      type: "leave_room";
    };

export type ServerMessage =
  | {
      type: "room_joined";
      userId: string;
      room: PublicRoomState;
    }
  | {
      type: "room_state";
      room: PublicRoomState;
    }
  | {
      type: "left_room";
    }
  | {
      type: "error";
      message: string;
    };