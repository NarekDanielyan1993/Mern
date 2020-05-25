const socketIo = require("socket.io")

let io;

exports.init = (webServer) => {
    io = socketIo(webServer)
    return io;
}

exports.getIo = () => {
    if(!io) {
        const error = new Error("Socket.io was not established")
        throw error;
    }
    return io;
}