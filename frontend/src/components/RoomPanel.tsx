import { useEffect, useState } from "react";
import type {
  ConnectionStatus,
  RoomState,
} from "../types/room";

type RoomPanelProps = {
  status: ConnectionStatus;
  room: RoomState | null;
  previewRoom: RoomState | null;
  userId: string | null;
  error: string | null;

  onCreateRoom: (name: string, icon: string) => void;
  onJoinRoom: (
    name: string,
    roomCode: string,
    icon: string,
  ) => void;

  onPreviewRoom: (roomCode: string) => void;
  onLeaveRoom: () => void;
  onClearError: () => void;
};

export function RoomPanel({
  status,
  room,
  previewRoom,
  userId,
  error,
  onCreateRoom,
  onJoinRoom,
  onPreviewRoom,
  onLeaveRoom,
  onClearError,
}: RoomPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [mode, setMode] =
    useState<"create" | "join">("create");

  const [joinStep, setJoinStep] =
    useState<"code" | "details">("code");

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [selectedIcon, setSelectedIcon] =
    useState("🌲");

  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] =
    useState(false);

  useEffect(() => {
  if (!previewRoom) return;

  const icons = ["🌲", "🏔️", "🌊", "🌵"];

  const availableIcon = icons.find(
    (icon) =>
      !previewRoom.users.some(
        (user) => user.icon === icon,
      ),
  );

  if (availableIcon) {
    setSelectedIcon(availableIcon);
  }
}, [previewRoom]);


  useEffect(() => {
    if (room) {
      setIsOpen(false);
    }
  }, [room]);


  useEffect(() => {
    if (previewRoom) {
      setJoinStep("details");
    }
  }, [previewRoom]);


  function openPanel(nextMode: "create" | "join") {
    setMode(nextMode);
    setJoinStep(
      nextMode === "join"
        ? "code"
        : "details",
    );

    setName("");
    setRoomCode("");
    setSelectedIcon("🌲");

    onClearError();
    setIsOpen(true);
  }


  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (mode === "create") {
      const cleanName = name.trim();

      if (!cleanName) return;

      onCreateRoom(
        cleanName,
        selectedIcon,
      );

      return;
    }


    const cleanCode =
      roomCode.trim().toUpperCase();


    if (joinStep === "code") {
      if (cleanCode.length !== 4) return;

      onPreviewRoom(cleanCode);
      return;
    }


    const cleanName = name.trim();

    if (!cleanName) return;

    onJoinRoom(
      cleanName,
      cleanCode,
      selectedIcon,
    );
  }


  async function copyCode() {
    if (!room) return;

    await navigator.clipboard.writeText(
      room.code,
    );

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
            >
              🔗
            </button>
          </div>

          <button
            type="button"
            className="room-leave-button"
            onClick={() =>
              setShowLeaveConfirm(true)
            }
          >
            Leave
          </button>
        </div>


        {showLeaveConfirm && (
          <div
            className="room-backdrop"
            onMouseDown={() =>
              setShowLeaveConfirm(false)
            }
          >
            <section
              className="leave-confirm"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >
              <h2>Leave room?</h2>

              <p>
                Are you sure you want to leave?
              </p>

              <div className="leave-confirm-actions">

                <button
                  type="button"
                  className="room-secondary-button"
                  onClick={() =>
                    setShowLeaveConfirm(false)
                  }
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
              onClick={() =>
                openPanel("create")
              }
            >
              Create Room
            </button>

            <button
              type="button"
              className="room-secondary-button"
              onClick={() =>
                openPanel("join")
              }
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
          onMouseDown={() =>
            setIsOpen(false)
          }
        >
          <section
            className="room-dialog"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="room-dialog-header">
              <div>
                <p className="section-kicker">
                  COLLABORATE
                </p>

                <h2>
                  {mode === "create"
                    ? "Create room"
                    : "Join room"}
                </h2>
              </div>

              <button
                type="button"
                className="room-close"
                onClick={() =>
                  setIsOpen(false)
                }
              >
                ×
              </button>
            </div>


            <form
              className="room-form"
              onSubmit={submit}
            >

              {mode === "join" &&
                joinStep === "code" && (
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
                            .replace(
                              /[^A-Z0-9]/g,
                              "",
                            ),
                        )
                      }
                      placeholder="HSZ8"
                    />
                  </label>
                )}


              {(mode === "create" ||
                joinStep === "details") && (
                <>
                  <label>
                    Your name

                    <input
                      type="text"
                      maxLength={30}
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value,
                        )
                      }
                      placeholder="Alice"
                    />
                  </label>


                  <div className="icon-picker">

                    {[
                      "🌲",
                      "🏔️",
                      "🌊",
                      "🌵",
                    ].map((icon) => {

                      const taken =
                        previewRoom?.users.some(
                          (user) =>
                            user.icon === icon,
                        ) ?? false;


                      return (
                        <button
                          type="button"
                          key={icon}
                          disabled={taken}
                          className={
                            selectedIcon === icon
                              ? "icon-option icon-option-selected"
                              : taken
                              ? "icon-option icon-option-disabled"
                              : "icon-option"
                          }
                          onClick={() => {
                            if (!taken) {
                              setSelectedIcon(icon);
                            }
                          }}
                        >
                          {icon}
                        </button>
                      );
                    })}

                  </div>
                </>
              )}


              {error && (
                <p className="room-error">
                  {error}
                </p>
              )}


              <button
                type="submit"
                className="room-submit-button"
                disabled={
                  mode === "create"
                    ? !name.trim()
                    : joinStep === "code"
                    ? roomCode.length !== 4
                    : !name.trim()
                }
              >
                {mode === "create"
                  ? "Create room"
                  : joinStep === "code"
                  ? "Continue"
                  : "Join room"}
              </button>

            </form>

          </section>
        </div>
      )}
    </>
  );
}