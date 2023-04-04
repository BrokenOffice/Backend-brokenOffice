const express = require("express");
const app = express();
const { db_sync } = require("./config/db");
const models = require("./models");
const router = require("./routes/index");
const volleyball = require("volleyball");
require("dotenv").config();
const { PORT } = process.env;
const cookiesParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("socket id", socket.id);

  socket.on("join_room", async(data) => {
    socket.join(data);
  });

  socket.on("chat message", (msg, room) => {
    console.log("Message: " + msg);
    io.to(room).emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("A user has disconnected.");
  });
});

const multerMid = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.use(multerMid.single("file"));

app.use(cookiesParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(volleyball);

app.use(express.json());

app.use("/", router);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err.message);
});

db_sync()
  .then(() => {
    httpServer.listen(PORT, () => console.log(`Server ON PORT: ${PORT}`));
  })
  .catch((err) => {
    console.error(err);
  });
