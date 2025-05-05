import RoomStateManager from "./room-state-manager.js";

export default function defineSocketEvents(io, redisClient) {
    const roomStateManager = new RoomStateManager(redisClient);
    io.on('connection', (socket) => {
        const userId = socket.request.session?.passport?.user?.id;
        const userName = socket.request.session?.passport?.user?.name;
        if (!userId) {
            return socket.disconnect();
        }
        socket.join(`user:${userId}`);
        console.log('A user connected:', userId);
        socket.on('message', (data) => {
            io.emit('message', 'server received: ' + data);
        });
        let roomId = '';
        socket.on('joinRoom', async (data) => {
            roomId = data.roomId;
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
            const roomState = await roomStateManager.syncRoomState(roomId);
            await roomStateManager.createAvatar(roomId, userId, userName, 1000, 1000);
            socket.emit('joinRoom', roomState);
        });
        socket.on('moveAvatar', async (data) => {
            const { x, y } = data;
            if (x && y) {
                await roomStateManager.moveAvatar(roomId, userId, x, y);
            }
            const roomState = await roomStateManager.syncRoomState(roomId);
            socket.emit('updateRoomState', roomState);
        });
        socket.on('disconnect', async () => {
            console.log('User disconnected:', userId);
            if (roomId) {
                await roomStateManager.deleteAvatar(roomId, userId);
                console.log(`User ${userId} avatar deleted from room ${roomId}`);
                roomId = '';
            }
        });
    });
}
