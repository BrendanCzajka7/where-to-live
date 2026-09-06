import type { RoomState } from "../types/room";

type LobbyProps = {
  room: RoomState;
  userId: string;
  onStart: () => void;
  onLeave: () => void;
};

export function Lobby({
  room,
  userId,
  onStart,
  onLeave,
}: LobbyProps) {
  const isHost = room.hostId === userId;

  async function copyCode() {
    await navigator.clipboard.writeText(room.code);
  }

  return (
    <main className="lobby">
      <button
        type="button"
        className="lobby-leave"
        onClick={onLeave}
      >
        Leave
      </button>

      <button
        type="button"
        className="lobby-room-code"
        onClick={copyCode}
      >
        <span>ROOM CODE</span>
        <strong>{room.code}</strong>
      </button>

      <div className="lobby-players">
        {room.users.map((user) => (
          <div className="lobby-player" key={user.id}>
            <div className="lobby-avatar">
                {user.icon}
             </div>

            <strong>{user.name}</strong>

            {user.id === room.hostId && (
              <span className="lobby-host">HOST</span>
            )}
          </div>
        ))}

        {Array.from({
          length: Math.max(0, 4 - room.users.length),
        }).map((_, index) => (
          <div
            className="lobby-player lobby-player-empty"
            key={`empty-${index}`}
          >
            <div className="lobby-avatar lobby-avatar-empty">+</div>
          </div>
        ))}
      </div>

      <div className="lobby-bottom">
        {isHost ? (
          <button
            type="button"
            className="lobby-start"
            onClick={onStart}
          >
            Start
          </button>
        ) : (
          <div className="lobby-waiting">
            Waiting for host
          </div>
        )}
      </div>
    </main>
  );
}