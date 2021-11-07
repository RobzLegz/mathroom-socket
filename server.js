require("dotenv").config();
const io = require("socket.io")(process.env.PORT, {
    cors: {
        origin: "http://localhost:3000",
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
    "#17abe8",
    "#664586",
    "#5FE4EC",
    "#32D455",
    "#3AB8E0",
    "#A365C9",
    "#B14242",
    "#E9ED37",
    "#D43259",
    "#EF93BF",
    "#FC993D",
    "#E73030",
    "#2FB64C",
    "#26A376",
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
        roomUsers.push({ 
            userId, 
            socketId,
            roomId, 
            username, 
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
            level: 0,
            points: 0,
        });
    }else if(roomUsers.length === 0){
        roomUsers.push({ 
            userId, 
            socketId,
            roomId, 
            username, 
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
            level: 0,
            points: 0,
        });
    }
};

const filterRooms = () => {
    if(disbandedIds.length > 0){
        rooms.forEach((room) => {
            if(disbandedIds.includes(room._id)){
                rooms.filter((r) => r._id !== room._id);
                rooms = rooms.filter((r) => r._id !== room._id);
                rooms.filter((r) => r !== room);
                rooms = rooms.filter((r) => r !== room);
            }else{
                disbandedIds.forEach(id => {
                    if(id === room._id){
                        rooms.filter((r) => r._id !== room._id);
                        rooms = rooms.filter((r) => r._id !== room._id);
                        rooms.filter((r) => r !== room);
                        rooms = rooms.filter((r) => r !== room);
                    }
                }) 
            }
        });
    }
}

const leaveRoom = (socketId, userId) => {
    roomUsers = roomUsers.filter((user) => user.socketId !== socketId);
    roomUsers = roomUsers.filter((user) => user.userId !== userId);
};

const completeLevel = (socketId) => {
    const user = roomUsers.find((rUser) => rUser.socketId === socketId);
    if(user){
        user.level += 1;
        user.points += 1;
    }
}

const failLevel = (socketId) => {
    const user = roomUsers.find((rUser) => rUser.socketId === socketId);
    if(user){
        user.level += 1;
    }
}

const disbandRoom = (roomId) => {
    rooms.filter((room) => room._id !== roomId);
    roomUsers.filter((user) => user.roomId !== roomId);
    disbandedIds.push(roomId);

    filterRooms();
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
    roomUsers = roomUsers.filter((user) => user.socketId !== socketId);
};

const addRoom = (data) => {
    filterRooms();
    
    if(rooms.some((room) => room.admin !== data.admin) && rooms.some((room) => room._id !== data._id)){
        rooms.push(data);
    }else if (rooms.length === 0){
        rooms.push(data);
    }
};

const startGame = (roomId) => {
    rooms.filter((room) => room._id !== roomId);
    disbandedIds.push(roomId);

    filterRooms();
};

const getRoomUser = (userId) => {
    return roomUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
    filterRooms();
    
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
        filterRooms();
        io.emit("getRooms", rooms);
    });

    socket.on("completeLevel", () => {
        completeLevel(socket.id);
        io.emit("getRoomUsers", roomUsers);
    });

    socket.on("failLevel", () => {
        failLevel(socket.id);
        io.emit("getRoomUsers", roomUsers);
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
        filterRooms();
        io.emit("removeRoom", roomId);
    });

    socket.on("startGame", (roomId) => {
        startGame(roomId);
        disbandRoom(roomId);
        filterRooms();
        io.emit("startedGame", roomId);
    });

    socket.on("getMessages", () => {
        io.emit("sendMessages", messages);
    });

    socket.on("disconnect", () => {
        console.log("a user disconnected!");
        filterRooms();
        removeUser(socket.id);
        io.emit("getRoomUsers", roomUsers);
        io.emit("getUsers", users);
    });
});