import {
  ClientMessage,
  preferenceKeys,
  Preferences,
} from "./types.js";

const standardPreferenceKeys = new Set([
  "affordability",
  "safety",
  "nature",
  "mountains",
  "jobs",
  "coast",
  "healthcare",
  "schools",
  "weatherSeverity",
]);

const directionalPreferenceKeys = new Set([
  "temperature",
  "humidity",
  "density",
  "politics",
]);

function isValidName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= 1 &&
    value.trim().length <= 30
  );
}

function isValidRoomCode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[A-Z0-9]{4}$/.test(value.toUpperCase())
  );
}

function isValidPreferences(value: unknown): value is Preferences {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const preferences = value as Record<string, unknown>;

  for (const key of preferenceKeys) {
    const preference = preferences[key];

    if (
      typeof preference !== "number" ||
      !Number.isFinite(preference)
    ) {
      return false;
    }

    if (
      standardPreferenceKeys.has(key) &&
      (preference < 0 || preference > 10)
    ) {
      return false;
    }

    if (
      directionalPreferenceKeys.has(key) &&
      (preference < -10 || preference > 10)
    ) {
      return false;
    }
  }

  return true;
}

export function parseClientMessage(
  data: string,
): ClientMessage | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("type" in parsed)
  ) {
    return null;
  }

  const message = parsed as Record<string, unknown>;

  switch (message.type) {
    case "create_room":
      if (!isValidName(message.name)) return null;

      return {
        type: "create_room",
        name: message.name.trim(),
      };

    case "join_room":
      if (
        !isValidName(message.name) ||
        !isValidRoomCode(message.roomCode)
      ) {
        return null;
      }

      return {
        type: "join_room",
        roomCode: message.roomCode.toUpperCase(),
        name: message.name.trim(),
      };

    case "update_preferences":
      if (!isValidPreferences(message.preferences)) {
        return null;
      }

      return {
        type: "update_preferences",
        preferences: message.preferences,
      };

    case "leave_room":
      return {
        type: "leave_room",
      };
    case "start_room":
      return {
        type: "start_room",
      };

    default:
      return null;
  }
}