import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConnectionStatus,
  Preferences,
  RoomState,
  ServerMessage,
} from "../types/room";

const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL ?? "ws://localhost:3000";

export function useRoomSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  const [status, setStatus] =
    useState<ConnectionStatus>("connecting");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setStatus("connecting");

    const socket = new WebSocket(WEBSOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("connected");
      setError(null);
    };

    socket.onmessage = (event) => {
      let message: ServerMessage;

      try {
        message = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }

      switch (message.type) {
        case "room_joined":
          setUserId(message.userId);
          setRoom(message.room);
          setError(null);
          break;

        case "room_state":
          setRoom(message.room);
          break;

        case "left_room":
          setRoom(null);
          setUserId(null);
          setError(null);
          break;

        case "error":
          setError(message.message);
          break;
      }
    };

    socket.onclose = () => {
      socketRef.current = null;
      setStatus("unavailable");
      setRoom(null);
      setUserId(null);

      if (shouldReconnectRef.current) {
        reconnectTimerRef.current = window.setTimeout(
          connect,
          3000,
        );
      }
    };

    socket.onerror = () => {
      setStatus("unavailable");
    };
  }, []);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      socketRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((message: object) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError("Collaboration is currently unavailable.");
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const createRoom = useCallback((name: string, icon: string) => {
      setError(null);

      return send({
        type: "create_room",
        name,
        icon,
      });
    },
    [send],
  );

    const startRoom = useCallback(() => {
      send({
        type: "start_room",
      });
    }, [send]);

  const joinRoom = useCallback(
  (name: string, roomCode: string, icon: string) => {
      setError(null);

      return send({
        type: "join_room",
        name,
        roomCode,
        icon,
      });
    },
    [send],
  );

  const updatePreferences = useCallback(
    (preferences: Preferences) => {
      send({
        type: "update_preferences",
        preferences,
      });
    },
    [send],
  );

  const leaveRoom = useCallback(() => {
    send({
      type: "leave_room",
    });
  }, [send]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    status,
    room,
    userId,
    error,
    createRoom,
    joinRoom,
    startRoom,
    updatePreferences,
    leaveRoom,
    clearError,
  };
}