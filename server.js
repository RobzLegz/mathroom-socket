require("dotenv").config();
const io = require("socket.io")(process.env.PORT, {
    cors: {
        origin: "https://mathroom.vercel.app",
    },
});

let users = [];
let roomUsers = [];
let rooms = [];
let messages = [];

const addUser = (userId, socketId) => {
    if(!users.some((user) => user.userId !== userId)){
        users.push({ userId, socketId });
    }else if(users.length === 0){
        users.push({ userId, socketId });
    }
};

const joinRoom = (userId, socketId, username, roomId) => {
    if(roomUsers.some((user) => user.userId !== userId)){
        roomUsers.push({ userId, socketId, roomId, username });
    }else if(roomUsers.length === 0){
        roomUsers.push({ userId, socketId, roomId, username });
    }
};

const leaveRoom = (socketId, userId) => {
    roomUsers = roomUsers.filter((user) => user.socketId !== socketId);
    roomUsers = roomUsers.filter((user) => user.userId !== userId);
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
    roomUsers = roomUsers.filter((user) => user.socketId !== socketId);
};

const addRoom = (data) => {
    if(rooms.some((room) => room.admin !== data.admin) && rooms.some((room) => room._id !== data._id)){
        rooms.push(data);
    }else if (rooms.length === 0){
        rooms.push(data);
    }
};

const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", users);
    });

    socket.on("joinRoom", (userId, username, roomId) => {
        joinRoom(userId, socket.id, username, roomId);
        io.emit("getRoomUsers", roomUsers);
    });

    socket.on("leaveRoom", (userId) => {
        leaveRoom(socket.id, userId);
        io.emit("getRoomUsers", roomUsers);
    });

    socket.on("addRoom", (data) => {
        addRoom(data);
        io.emit("getRooms", rooms);
    });

    socket.on("sendMessage", (message) => {
        messages.push(message);
        io.emit("recieveMessage", messages);
    });

    socket.on("requestUsers", () => {
        io.emit("getRoomUsers", roomUsers);
    });

    socket.on("disconnect", () => {
        console.log("a user disconnected!");
        removeUser(socket.id);
        io.emit("getRoomUsers", roomUsers);
        io.emit("getUsers", users);
        io.emit("getRooms", rooms);
    });
});