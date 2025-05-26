import express from "express";
import cors from "cors";
import http from "http";
import "dotenv/config";
import connectDB from "./liv/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoute.js";
import { Server } from "socket.io";
// create express app and http server
const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// store online users

export const userSocketMap = {}; // {userId: socketId}

//  socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id; // store the socket id for the user
  }
  // emit online users to all clients

  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId]; // remove the socket id for the user
    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // emit updated online users
  });
});

// middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

app.use("/api/status", (req, res) => {
  res.send("Server is running");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

await connectDB();
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
