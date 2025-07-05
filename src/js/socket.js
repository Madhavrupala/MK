// MK Games Socket.js - Enhanced Two-Player Communication

class MKGamesSocket {
    constructor(app) {
        this.socket = io(); // Initialize socket.io
        this.app = app;
        this.reconnectionAttempts = 0;
        this.pollingInterval = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to the server');
            this.app.updateConnectionStatus('connected');
            
            // If player already selected, send join event
            if (this.app.currentPlayer) {
                this.emitPlayerJoin();
            }
            
            // Start polling for player status
            this.startPlayerStatusPolling();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from the server');
            this.app.updateConnectionStatus('disconnected');
        });

        // Game-specific events
        this.socket.on('players_status', (data) => {
            this.app.updatePlayersStatus(data);
            
            // Check if both players are online and show notification
            const bothOnline = data.madhav && data.madhav.online && data.khushi && data.khushi.online;
            if (bothOnline && !this.app.bothPlayersNotified && this.app.currentPlayer) {
                this.app.notifyBothPlayersOnline();
            }
        });

        this.socket.on('chat_message', (data) => {
            this.app.receiveChatMessage(data);
        });

        this.socket.on('player_ready', (data) => {
            this.app.updatePlayerReadyStatus(data);
        });

        this.socket.on('game_selected', (data) => {
            this.app.handleGameSelected(data);
        });

        this.socket.on('game_start', (data) => {
            this.app.startGame(data);
        });

        // Live reactions for fun interactive chat
        this.socket.on('live_reaction', (data) => {
            this.app.showLiveReaction(data);
        });
    }

    // Emit events to server
    emitPlayerJoin() {
        if (!this.socket || !this.app.currentPlayer) return;
        
        const name = this.app.currentPlayer === 'madhav' ? 'Madhav' : 'Khushi';
        const avatar = this.app.currentPlayer === 'madhav' ? '👨‍💻' : '👩‍💻';
        
        this.socket.emit('player_join', {
            player: this.app.currentPlayer,
            name: name,
            avatar: avatar,
            timestamp: new Date()
        });
    }

    emitChatMessage(messageData) {
        if (!this.socket) return;
        this.socket.emit('chat_message', messageData);
    }

    emitPlayerReady(readyStatus) {
        if (!this.socket) return;
        this.socket.emit('player_ready', {
            player: this.app.currentPlayer,
            gameType: this.app.selectedGame,
            ready: readyStatus
        });
    }

    emitGameSelected(gameType) {
        if (!this.socket) return;
        this.socket.emit('game_selected', {
            player: this.app.currentPlayer,
            gameType: gameType
        });
    }

    emitLiveReaction(emoji) {
        if (!this.socket) return;
        
        const name = this.app.currentPlayer === 'madhav' ? 'Madhav' : 'Khushi';
        
        this.socket.emit('live_reaction', {
            player: this.app.currentPlayer,
            name: name,
            emoji: emoji,
            timestamp: new Date()
        });
    }

    startPlayerStatusPolling() {
        // Clear any existing polling
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Poll for player status every 5 seconds
        this.pollingInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('get_players_status');
            }
        }, 5000);
    }
}

// Initialize socket communication when app is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the MKGamesApp to be initialized
    setTimeout(() => {
        if (window.mkGamesApp) {
            // Create the socket manager
            window.mkGamesSocket = new MKGamesSocket(window.mkGamesApp);
        }
    }, 100);
});