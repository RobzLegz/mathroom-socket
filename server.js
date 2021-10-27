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
let disbandedIds = [];

const colors = [
    "#aef511",
    "#5811f5",
    "#b516c7",
    "#e81717",
    "#e8d517",
    "#e8e817",
    "#1756e8",
    "#17abe8"
]

const addUser = (userId, socketId) => {
    if(!users.some((user) => user.userId !== userId)){
        users.push({ userId, socketId });
    }else if(users.length === 0){
        users.push({ userId, socketId });
    }
};

const joinRoom = (userId, socketId, username, roomId) => {
    if(roomUsers.some((user) => user.userId !== userId)){
        roomUsers.push({ userId, socketId, roomId, username, color: colors[Math.floor(Math.random() * 6)] });
    }else if(roomUsers.length === 0){
        roomUsers.push({ userId, socketId, roomId, username, color: colors[Math.floor(Math.random() * 6)] });
    }
};

const leaveRoom = (socketId, userId) => {
    roomUsers = roomUsers.filter((user) => user.socketId !== socketId);
    roomUsers = roomUsers.filter((user) => user.userId !== userId);
};

const disbandRoom = (roomId) => {
    rooms.filter((room) => room._id !== roomId);
    disbandedIds.push(roomId);
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

const startGame = (roomId) => {
    rooms.filter((room) => room._id !== roomId);
};

const getRoomUser = (userId) => {
    return roomUsers.find((user) => user.userId === userId);
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
        const color = getRoomUser(message.userId).color;

        const data = {
            roomID: message.roomID,
            username: message.username,
            message: message.message,
            userId: message.userId,
            color: color
        }

        messages.push(data);
        io.emit("recieveMessage", messages);
    });

    socket.on("requestUsers", () => {
        io.emit("getRoomUsers", roomUsers);
    });

    socket.on("disbandRoom", (roomId) => {
        disbandRoom(roomId);
        io.emit("removeRoom", roomId);
    });

    socket.on("startGame", (roomId) => {
        startGame(roomId);
        io.emit("startedGame", roomId);
    });

    socket.on("disconnect", () => {
        console.log("a user disconnected!");
        removeUser(socket.id);
        io.emit("getRoomUsers", roomUsers);
        io.emit("getUsers", users);
    });
});