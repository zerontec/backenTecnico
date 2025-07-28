const { Server } = require("socket.io");

let io = null;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    
    return io;
};

module.exports = { io, initSocket };
