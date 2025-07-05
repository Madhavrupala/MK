// Player Management Utility
class PlayerManager {
    constructor() {
        this.players = new Map();
        this.rooms = new Map();
    }

    // Add a new player
    addPlayer(socketId, playerData) {
        this.players.set(socketId, {
            ...playerData,
            socketId: socketId,
            joinedAt: new Date(),
            currentRoom: null,
            online: true
        });
        return this.players.get(socketId);
    }

    // Get player by socket ID
    getPlayer(socketId) {
        return this.players.get(socketId);
    }

    // Get player by username
    getPlayerByUsername(username) {
        for (const [id, player] of this.players.entries()) {
            if (player.username === username) {
                return player;
            }
        }
        return null;
    }

    // Remove player
    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player && player.currentRoom) {
            this.leaveRoom(socketId, player.currentRoom);
        }
        this.players.delete(socketId);
        return player;
    }

    // Update player status
    updatePlayerStatus(socketId, status) {
        const player = this.players.get(socketId);
        if (player) {
            player.online = status;
            return player;
        }
        return null;
    }

    // Get all online players
    getOnlinePlayers() {
        return Array.from(this.players.values()).filter(player => player.online);
    }

    // Room management
    createRoom(roomCode, gameType, hostSocketId) {
        const host = this.players.get(hostSocketId);
        if (!host) return null;

        const room = {
            code: roomCode,
            gameType: gameType,
            host: host.username,
            players: [host],
            status: 'waiting',
            createdAt: new Date(),
            maxPlayers: this.getMaxPlayers(gameType)
        };

        this.rooms.set(roomCode, room);
        host.currentRoom = roomCode;
        
        return room;
    }

    // Get max players for a game type
    getMaxPlayers(gameType) {
        const maxPlayers = {
            'ludo': 4,
            'isto': 4,
            'carrom': 4,
            'tictactoe': 2,
            'snake': 6,
            'dotjoin': 4
        };
        return maxPlayers[gameType] || 4;
    }

    // Get statistics
    getStats() {
        return {
            totalPlayers: this.players.size,
            onlinePlayers: this.getOnlinePlayers().length,
            totalRooms: this.rooms.size,
            activeRooms: Array.from(this.rooms.values()).filter(r => r.status === 'playing').length,
            waitingRooms: Array.from(this.rooms.values()).filter(r => r.status === 'waiting').length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerManager;
} else {
    window.PlayerManager = PlayerManager;
}