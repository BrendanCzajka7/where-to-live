import { useState } from "react";
import type {
  ConnectionStatus,
  RoomState,
} from "../types/room";

type RoomPanelProps = {
  status: ConnectionStatus;
  room: RoomState | null;
  userId: string | null;
  error: string | null;
  onCreateRoom: (name: string, icon: string) => void;
  onJoinRoom: (name: string, roomCode: string, icon: string) => void;
  onLeaveRoom: () => void;
  onClearError: () => void;
};

export function RoomPanel({
  status,
  room,
  userId,
  error,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onClearError,
}: RoomPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [selectedIcon, setSelectedIcon] = useState("🌲");

  function openPanel(nextMode: "create" | "join") {
    setMode(nextMode);
    onClearError();
    setIsOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) return;

    if (mode === "create") {
      onCreateRoom(cleanName, selectedIcon);
      return;
    }

    const cleanCode = roomCode.trim().toUpperCase();

    if (cleanCode.length !== 4) return;

    onJoinRoom(cleanName, cleanCode, selectedIcon);
    setIsOpen(false);
  }

  async function copyCode() {
    if (!room) return;

    await navigator.clipboard.writeText(room.code);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }
  function leave() {
  onLeaveRoom();
  setShowLeaveConfirm(false);
  setIsOpen(false);
  setName("");
  setRoomCode("");
}

  if (room) {
  return (
    <>
      <div className="room-actions">
      <div className="room-code-display">
        <span>{room.code}</span>

        <button
          type="button"
          className="room-copy-link"
          onClick={copyCode}
          aria-label="Copy room code"
          title={copied ? "Copied" : "Copy room code"}
        >
          🔗
        </button>
      </div>

      <button
        type="button"
        className="room-leave-button"
        onClick={() => setShowLeaveConfirm(true)}
      >
        Leave
      </button>
    </div>

      {isOpen && (
        <div
          className="room-backdrop"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            className="room-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="room-dialog-header">
              <div>
                <p className="section-kicker">GROUP ROOM</p>
                <h2 id="room-dialog-title">{room.code}</h2>
              </div>

              <button
                type="button"
                className="room-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close room details"
              >
                ×
              </button>
            </div>

            <div className="room-members">
              <span className="room-label">
                {room.users.length}{" "}
                {room.users.length === 1 ? "person" : "people"}
              </span>

              {room.users.map((user) => (
                <div className="room-member" key={user.id}>
                  <span className="member-dot" />

                  <strong>{user.name}</strong>

                  {user.id === userId && <span>You</span>}
                </div>
              ))}
            </div>

            <div className="room-dialog-actions">
              <button
                type="button"
                className="room-secondary-button"
                onClick={copyCode}
              >
                {copied ? "Copied" : "Copy room code"}
              </button>
            </div>
          </section>
        </div>
      )}
      {showLeaveConfirm && (
          <div
            className="room-backdrop"
            onMouseDown={() => setShowLeaveConfirm(false)}
          >
            <section
              className="leave-confirm"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="leave-confirm-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <h2 id="leave-confirm-title">Leave room?</h2>
              <p>Are you sure you want to leave? Your preferences will be lost</p>

              <div className="leave-confirm-actions">
                <button
                  type="button"
                  className="room-secondary-button"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="room-leave-button"
                  onClick={leave}
                >
                  Leave
                </button>
              </div>
            </section>
          </div>
        )}
    </>
  );
}

  return (
    <>
      <div className="room-actions">
        {status === "connected" ? (
            <>
              <button
                type="button"
                className="room-primary-button"
                onClick={() => openPanel("create")}
              >
                Create Room
              </button>

              <button
                type="button"
                className="room-secondary-button"
                onClick={() => openPanel("join")}
              >
                Join Room
              </button>
            </>
          ) : (
            <button
              type="button"
              className="room-secondary-button"
              disabled
            >
              Multiplayer Offline
            </button>
          )}
        </div>

      {isOpen && (
        <div
          className="room-backdrop"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            className="room-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="room-dialog-header">
              <div>
                <p className="section-kicker">COLLABORATE</p>
                <h2 id="room-dialog-title">
                  {mode === "create"
                    ? "Start a room"
                    : "Join a room"}
                </h2>
              </div>

              <button
                type="button"
                className="room-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="room-tabs">
              <button
                type="button"
                className={mode === "create" ? "active" : ""}
                onClick={() => {
                  setMode("create");
                  onClearError();
                }}
              >
                Create
              </button>

              <button
                type="button"
                className={mode === "join" ? "active" : ""}
                onClick={() => {
                  setMode("join");
                  onClearError();
                }}
              >
                Join
              </button>
            </div>

            <form className="room-form" onSubmit={submit}>
              <label>
                Your name
                <input
                  type="text"
                  maxLength={30}
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Alice"
                  autoFocus
                />
               </label>

              <div className="icon-picker">
                {["🌲", "🏔️", "🌊", "🌵"].map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    className={
                      selectedIcon === icon
                        ? "icon-option icon-option-selected"
                        : "icon-option"
                    }
                    aria-pressed={selectedIcon === icon}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {mode === "join" && (
                <label>
                  Room code
                  <input
                    type="text"
                    maxLength={4}
                    value={roomCode}
                    onChange={(event) =>
                      setRoomCode(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, ""),
                      )
                    }
                    placeholder="HSZ8"
                    className="room-code-input"
                  />
                </label>
              )}

              {error && <p className="room-error">{error}</p>}

              <button
                type="submit"
                className="room-submit-button"
                disabled={
                  !name.trim() ||
                  (mode === "join" &&
                    roomCode.trim().length !== 4)
                }
              >
                {mode === "create"
                  ? "Create room"
                  : "Join room"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}