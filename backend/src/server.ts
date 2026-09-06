import { WebSocketServer } from "ws";

const PORT = 3000;

const wss = new WebSocketServer({
  port: PORT,
});

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.send(
    JSON.stringify({
      type: "connected",
      message: "Connected to Where Should We Live",
    }),
  );

  socket.on("message", (data) => {
    console.log("Received:", data.toString());
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log(`WebSocket server running on port ${PORT}`);