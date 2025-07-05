const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const gameRoutes = require('./routes/game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../src')));

// Use game routes
app.use('/api/games', gameRoutes);

// In-memory storage for simplified two-player system
const players = {
    madhav: { online: false, socketId: null, ready: false, selectedGame: null },
    khushi: { online: false, socketId: null, ready: false, selectedGame: null }
};

const gameSession = {
    active: false,
    gameType: null,
    startTime: null
};

// Socket connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Player joins the platform
    socket.on('player_join', (data) => {
        const { player, name, avatar } = data;
        
        if (players[player]) {
            players[player].online = true;
            players[player].socketId = socket.id;
            players[player].name = name;
            players[player].avatar = avatar;
            
            console.log(`${name} (${player}) joined`);
            
            // Notify all clients about player status
            io.emit('players_status', {
                madhav: { online: players.madhav.online },
                khushi: { online: players.khushi.online }
            });
        }
    });

    // Get players status (polling)
    socket.on('get_players_status', () => {
        io.emit('players_status', {
            madhav: { online: players.madhav.online },
            khushi: { online: players.khushi.online }
        });
    });

    // Game selection
    socket.on('game_selected', (data) => {
        const { player, gameType } = data;
        
        if (players[player]) {
            players[player].selectedGame = gameType;
            players[player].ready = false; // Reset ready status on new game selection
            
            console.log(`${player} selected game: ${gameType}`);
            
            // Broadcast to all clients
            io.emit('game_selected', {
                player: player,
                gameType: gameType
            });
        }
    });

    // Player ready status
    socket.on('player_ready', (data) => {
        const { player, gameType, ready } = data;
        
        if (players[player]) {
            players[player].ready = ready;
            players[player].selectedGame = gameType;
            
            console.log(`${player} is ${ready ? 'ready' : 'not ready'} for ${gameType}`);
            
            // Notify all clients about ready status
            io.emit('player_ready_status', {
                player: player,
                ready: ready,
                gameType: gameType
            });
            
            // Check if both players are ready for the same game
            if (players.madhav.ready && players.khushi.ready && 
                players.madhav.selectedGame === players.khushi.selectedGame) {
                
                // Start game countdown
                gameSession.active = true;
                gameSession.gameType = gameType;
                gameSession.startTime = new Date();
                
                io.emit('game_ready', {
                    gameType: gameType,
                    players: ['madhav', 'khushi']
                });
                
                console.log(`Game starting: ${gameType}`);
            }
        }
    });

    // Chat messages
    socket.on('chat_message', (data) => {
        const { sender, senderName, text, timestamp } = data;
        
        console.log(`Chat from ${senderName}: ${text}`);
        
        // Broadcast to all connected clients except sender
        socket.broadcast.emit('chat_message', {
            sender,
            senderName,
            text,
            timestamp
        });
    });
    
    // Live reactions
    socket.on('live_reaction', (data) => {
        const { player, name, emoji, timestamp } = data;
        
        console.log(`Live reaction from ${name}: ${emoji}`);
        
        // Broadcast to all except sender
        socket.broadcast.emit('live_reaction', {
            player,
            name,
            emoji,
            timestamp
        });
    });

    // Game-specific actions
    socket.on('game_action', (data) => {
        const { gameType, action, player, gameData } = data;
        
        console.log(`Game action from ${player}: ${action} in ${gameType}`);
        
        // Broadcast to all except sender
        socket.broadcast.emit('game_action', {
            gameType,
            action,
            player,
            gameData,
            timestamp: new Date()
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // Find which player disconnected and mark as offline
        for (const [playerName, playerData] of Object.entries(players)) {
            if (playerData.socketId === socket.id) {
                players[playerName].online = false;
                players[playerName].socketId = null;
                players[playerName].ready = false;
                
                console.log(`${playerName} disconnected`);
                
                // Notify all clients about player status
                io.emit('players_status', {
                    madhav: { online: players.madhav.online },
                    khushi: { online: players.khushi.online }
                });
                
                // Reset game session if active
                if (gameSession.active) {
                    gameSession.active = false;
                    gameSession.gameType = null;
                    gameSession.startTime = null;
                    
                    io.emit('game_ended', { reason: 'player_disconnected' });
                }
                break;
            }
        }
        
        console.log('User disconnected:', socket.id);
    });
});

// Helper functions
function getPlayerName(socketId) {
    for (const [playerName, playerData] of Object.entries(players)) {
        if (playerData.socketId === socketId) {
            return playerName;
        }
    }
    return null;
}

// API endpoint to get current game status
app.get('/api/game-status', (req, res) => {
    res.json({
        players: {
            madhav: { 
                online: players.madhav.online, 
                ready: players.madhav.ready,
                selectedGame: players.madhav.selectedGame 
            },
            khushi: { 
                online: players.khushi.online, 
                ready: players.khushi.ready,
                selectedGame: players.khushi.selectedGame 
            }
        },
        gameSession: gameSession
    });
});

// Constants for game player limits
const MAX_PLAYERS = {
    'ludo': 4,
    'isto': 4,
    'carrom': 4,
    'tictactoe': 2,
    'snake': 6,
    'dotjoin': 4
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 MK Games Server running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} to play!`);
});
