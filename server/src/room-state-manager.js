export default class RoomStateManager {
    constructor(redisClient) {
        this.redisClient = redisClient;
        this.roomStates = {};
    }
    async createAvatar(roomId, userId, userName, x, y) {
        const avatar = {
            userName,
            x,
            y,
        };
        this.roomStates[roomId].avatars[userId] = avatar;
        await this.redisClient.hmset(`${roomId}:avatars:${userId}`, avatar);
        await this.redisClient.sadd(`${roomId}:avatarset`, userId);
    }
    async syncAvatar(roomId, userId) {
        const roomState = this.getRoomState(roomId);
        const redisAvatar = await this.redisClient.hgetall(`${roomId}:avatars:${userId}`);
        const avatar = {
            userName: redisAvatar.userName,
            x: parseInt(redisAvatar.x, 10),
            y: parseInt(redisAvatar.y, 10),
        };
        roomState.avatars[userId] = avatar;
        return avatar;
    }
    getAvatar(roomId, userId) {
        return this.getRoomState(roomId).avatars[userId];
    }
    async moveAvatar(roomId, userId, x, y) {
        const avatar = this.getAvatar(roomId, userId);
        if (avatar) {
            avatar.x = x;
            avatar.y = y;
            await this.redisClient.hmset(`${roomId}:avatars:${userId}`, { x, y });
        }
    }
    async deleteAvatar(roomId, userId) {
        delete this.roomStates[roomId].avatars[userId];
        await this.redisClient.srem(`${roomId}:avatarset`, userId);
        await this.redisClient.del(`${roomId}:avatars:${userId}`);
        if (!Object.keys(this.getRoomState(roomId).avatars).length) {
            await this.deleteRoomState(roomId);
        }
    }
    createRoomState(roomId) {
        if (!this.roomStates[roomId]) {
            this.roomStates[roomId] = {
                avatars: {},
            };
        }
        return this.getRoomState(roomId);
    }
    async syncRoomState(roomId) {
        const roomState = this.getRoomState(roomId) || this.createRoomState(roomId);
        const userIdList = await this.redisClient.smembers(`${roomId}:avatarset`);
        const userIdSet = new Set(userIdList);
        await Promise.all(
            Object.keys(roomState.avatars).map(async (userId) => {
                if (userIdSet.has(userId)) {
                    await this.syncAvatar(roomId, userId);
                    userIdSet.delete(userId);
                } else {
                    delete this.roomStates[roomId].avatars[userId];
                }
            })
        );
        userIdSet.forEach((userId) => {
            this.syncAvatar(roomId, userId);
        });
        return roomState;
    }
    getRoomState(roomId) {
        return this.roomStates[roomId];
    }
    async deleteRoomState(roomId) {
        if (this.roomStates[roomId]) {
            delete this.roomStates[roomId];
            console.log(`Room ${roomId} deleted`);
        }
    }
}
