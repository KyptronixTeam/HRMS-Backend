require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./database/conn");
const http = require("http");
const WebSocket = require("ws");
const Message = require("./database/Models/Message.js"); // Import Message Model
  
const PORT = 5000;
const app = express();
connectDB();

// Create HTTP Server & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Enhanced CORS configuration
app.use(cors({
  origin: "*", // Allow all origins (use specific origins in production, e.g., ["http://localhost:3000"])
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow all standard methods
  allowedHeaders: ["Content-Type", "Authorization", "Accept"], // Allow common headers
  exposedHeaders: ["Authorization"], // Expose headers if needed
  credentials: true // Allow cookies and authorization headers
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("combined"));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Import Routes
const RegisterRoute = require("./routers/auth/Register.js");
const LoginRoute = require("./routers/auth/Login.js");
const CreateTask = require("./routers/hr/create-task.js");
const GetTasks = require("./routers/hr/get-task.js");
const GetAllEmployee = require("./routers/employee/getAllEmployee.js");
const UpdateTask = require("./routers/hr/updateTask.js");
const UploadFile = require("./routers/employee/uploadFile.js");
const CreateEmployee = require("./routers/hr/create-employee.js");
const UploadSignature = require("./routers/employee/uploadSignature.js");
const Getchat = require("./routers/chat/getChatHistory.js");

// Apply Routes
app.use("/auth", RegisterRoute);
app.use("/auth", LoginRoute);
app.use("/task", CreateTask);
app.use("/task", GetTasks);
app.use("/task", UpdateTask);
app.use("/employee", GetAllEmployee);
app.use("/doc", UploadFile);
app.use("/hr", CreateEmployee);
app.use("/signature", UploadSignature);
app.use("/chat", Getchat); 

// WebSocket for Real-Time Chat
const users = {}; // Store connected users { userId: WebSocket }


wss.on("connection", (ws) => {
  console.log("New WebSocket Connection");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      const { event, senderId, receiverId, content, offer, answer, candidate } = data;

      if (event === "login") {
        if (!senderId) {
          console.error("Login failed: No senderId provided", data);
          ws.send(JSON.stringify({ event: "login-error", message: "Invalid user ID" }));
          return;
        }
        users[senderId] = ws;
        console.log(`User ${senderId} connected`);
        console.log("Current users:", Object.keys(users));
        ws.send(JSON.stringify({ event: "login-success", senderId }));
      } else if (event === "message") {
        if (!senderId || !receiverId || !content) {
          console.error("Invalid message data:", data);
          return;
        }
        const newMessage = new Message({ sender: senderId, receiver: receiverId, content });
        await newMessage.save();

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(newMessage));
          }
        });
      } else if (event === "call") {
        console.log("Processing call event. Sender:", senderId, "Receiver:", receiverId);
        console.log("Current users:", Object.keys(users));
        if (users[receiverId]) {
          users[receiverId].send(
            JSON.stringify({
              event: "incoming-call",
              senderId,
              offer,
            })
          );
        } else {
          console.error(`Receiver ${receiverId} not found in users`);
          ws.send(JSON.stringify({ event: "call-error", message: "User not connected" }));
        }
      } else if (event === "answer") {
        if (users[receiverId]) {
          users[receiverId].send(
            JSON.stringify({
              event: "call-answer",
              senderId,
              answer,
            })
          );
        } else {
          console.error(`Receiver ${receiverId} not found for answer`);
        }
      } else if (event === "ice-candidate") {
        if (users[receiverId]) {
          users[receiverId].send(
            JSON.stringify({
              event: "ice-candidate",
              senderId,
              candidate,
            })
          );
        }
      } else if (event === "end-call") {
        if (users[receiverId]) {
          users[receiverId].send(
            JSON.stringify({
              event: "end-call",
              senderId,
            })
          );
        }
      }
    } catch (error) {
      console.error("WebSocket Error:", error);
    }
  });

  ws.on("close", () => {
    Object.keys(users).forEach((userId) => {
      if (users[userId] === ws) {
        delete users[userId];
        console.log(`User ${userId} disconnected`);
        console.log("Current users:", Object.keys(users));
      }
    });
  });
});

// ✅ Use `server.listen()` instead of `app.listen()`
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
