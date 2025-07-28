const io = require("socket.io-client");
const API_URL = "http://localhost:4000";

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJuYW1lIjoibGVvIiwiaWF0IjoxNzQ0MjU3MDc4LCJleHAiOjE3NDQzMDAyNzh9._QTKsPQTTwfXu1gdC1c0xPMCSJNkWef7aRlbRI9dZhU";

const socket = io(API_URL, {
  auth: { token },
});

socket.on("connect", () => {
  console.log("✅ Conectado al servidor Socket.io");
});

socket.on("nueva_notificacion", (notificacion) => {
  console.log("📨 Notificación recibida:", notificacion);
});

socket.on("connect_error", (err) => {
  console.error("Error de conexión:", err.message);
});