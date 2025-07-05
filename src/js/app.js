// MK Games - Simplified Two-Player Application Logic
class MKGamesApp {
    constructor() {
        this.currentPlayer = null;
        this.selectedGame = null;
        this.isReady = false;
        this.socket = null;
        this.otherPlayerReady = false;
        this.gameStartCountdown = null;
        this.chatVisible = false;
        this.messageCount = 0;
        this.bothPlayersNotified = false;
        
        this.init();
    }

    init() {
        console.log('🚀 MK Games App initializing...');
        this.setupEventListeners();
        this.setupEmojiShortcuts();
        this.connectToServer();
        this.showLoginScreen();
        console.log('✅ MK Games App initialized');
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Game selection
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameCard = e.target.closest('.game-card');
                const gameType = gameCard.dataset.game;
                this.selectGame(gameType);
            });
        });

        // Lobby controls
        document.getElementById('backToMain').addEventListener('click', () => {
            this.showGameSelection();
        });

        document.getElementById('readyBtn').addEventListener('click', () => {
            this.toggleReady();
        });

        // Chat controls
        document.getElementById('chatToggleBtn').addEventListener('click', () => {
            this.toggleChat();
        });

        document.getElementById('closeChatBtn').addEventListener('click', () => {
            this.closeChat();
        });

        document.getElementById('sendChatBtn').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Emoji picker
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.addEmoji(e.target.dataset.emoji);
            });
        });
    }

    connectToServer() {
        console.log('🔌 Starting Socket.IO connection...');
        console.log('io available:', typeof io !== 'undefined');
        
        if (typeof io !== 'undefined') {
            try {
                console.log('📡 Creating socket connection...');
                this.socket = io();
                console.log('✅ Socket created:', this.socket);
                this.setupSocketListeners();
            } catch (error) {
                console.error('❌ Error creating socket:', error);
            }
        } else {
            console.error('❌ Socket.IO not available');
        }
        this.updateConnectionStatus('connecting');
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus('connected');
            
            // Test ping to verify communication
            console.log('📤 Sending test ping...');
            this.socket.emit('test_ping', { message: 'Hello from client!' });
            
            if (this.currentPlayer) {
                const playerName = this.currentPlayer === 'madhav' ? 'Madhav' : 'Khushi';
                const playerAvatar = this.currentPlayer === 'madhav' ? '👨‍💻' : '👩‍💻';
                this.socket.emit('player_join', { 
                    player: this.currentPlayer,
                    name: playerName,
                    avatar: playerAvatar
                });
                this.socket.emit('get_players_status');
            }
        });

        this.socket.on('test_pong', (data) => {
            console.log('📥 Received test pong:', data);
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('disconnected');
        });

        this.socket.on('players_status', (data) => {
            this.updatePlayersStatus(data);
        });

        this.socket.on('game_ready', (data) => {
            console.log('🎯 GAME_READY EVENT RECEIVED:', data);
            this.handleGameReady(data);
        });

        this.socket.on('game_start', (data) => {
            console.log('🎮 GAME_START EVENT RECEIVED:', data);
            alert(`Game Start Event Received! Game: ${data?.gameType || 'Unknown'}`);
            this.startGame(data);
        });

        this.socket.on('chat_message', (data) => {
            this.receiveChatMessage(data);
        });

        this.socket.on('player_ready_status', (data) => {
            this.updatePlayerReadyStatus(data);
        });
        
        this.socket.on('game_selected', (data) => {
            this.handleGameSelected(data);
        });
        
        this.socket.on('live_reaction', (data) => {
            this.showLiveReaction(data);
        });
    }

    handleLogin() {
        const playerSelect = document.getElementById('playerSelect');
        const selectedPlayer = playerSelect.value;
        
        if (!selectedPlayer) {
            this.showAlert('Please select a player');
            return;
        }

        this.currentPlayer = selectedPlayer;
        
        // Update user avatar and name
        const avatar = selectedPlayer === 'madhav' ? '👨‍💻' : '👩‍💻';
        const name = selectedPlayer === 'madhav' ? 'Madhav' : 'Khushi';
        
        document.getElementById('userAvatar').textContent = avatar;
        document.getElementById('currentUsername').textContent = name;

        // Connect to server with player info
        if (this.socket && this.socket.connected) {
            const playerName = this.currentPlayer === 'madhav' ? 'Madhav' : 'Khushi';
            const playerAvatar = this.currentPlayer === 'madhav' ? '👨‍💻' : '👩‍💻';
            this.socket.emit('player_join', { 
                player: this.currentPlayer,
                name: playerName,
                avatar: playerAvatar
            });
            this.socket.emit('get_players_status');
        }
        this.showGameSelection();
    }

    selectGame(gameType) {
        this.selectedGame = gameType;
        this.isReady = false;
        this.otherPlayerReady = false;
        this.bothPlayersNotified = false; // Reset notification for new game
        
        // Update lobby with selected game
        const gameNames = {
            'ludo': 'Ludo Classic',
            'isto': 'Isto',
            'carrom': 'Carrom Board',
            'tictactoe': 'Tic Tac Toe',
            'snake': 'Snakes & Ladders',
            'dotjoin': 'Dot Connect'
        };
        
        document.getElementById('selectedGameName').textContent = gameNames[gameType];
        document.getElementById('lobbyTitle').textContent = `${gameNames[gameType]} Lobby`;
        
        // Reset ready states
        this.updateReadyButton();
        this.updatePlayerReadyDisplay();
        
        // Notify server about game selection
        if (this.socket) {
            this.socket.emit('game_selected', {
                player: this.currentPlayer,
                gameType: gameType
            });
            // Also reset ready state for both players on server
            this.socket.emit('player_ready', {
                player: this.currentPlayer,
                gameType: gameType,
                ready: false
            });
        }
        
        this.showLobby();
    }

    toggleReady() {
        this.isReady = !this.isReady;
        this.updateReadyButton();
        
        // Notify server about ready status
        if (this.socket) {
            const readyData = {
                player: this.currentPlayer,
                gameType: this.selectedGame,
                ready: this.isReady
            };
            console.log('📤 Emitting player_ready:', readyData);
            console.log('🔌 Socket connected:', this.socket.connected);
            this.socket.emit('player_ready', readyData);
        } else {
            console.error('❌ Socket not available!');
        }
        
        // Check if both players are ready
        this.checkGameStart();
    }

    updateReadyButton() {
        const readyBtn = document.getElementById('readyBtn');
        if (this.isReady) {
            readyBtn.textContent = '✅ Ready! Waiting for other player...';
            readyBtn.classList.add('ready');
            readyBtn.classList.remove('waiting');
        } else {
            readyBtn.textContent = 'I\'m Ready! 🎯';
            readyBtn.classList.remove('ready');
            readyBtn.classList.add('waiting');
        }
    }

    updatePlayerReadyStatus(data) {
        console.log('Received player_ready_status:', data);
        const { player, ready } = data;
        
        if (player !== this.currentPlayer) {
            this.otherPlayerReady = ready;
            console.log(`Other player (${player}) ready status:`, ready);
        } else {
            console.log(`Own ready status confirmed:`, ready);
        }
        
        // Update ready display
        const readyElement = document.getElementById(`${player}Ready`);
        if (readyElement) {
            const statusSpan = readyElement.querySelector('.ready-status');
            if (ready) {
                statusSpan.textContent = 'Ready! 🎯';
                readyElement.classList.add('ready');
            } else {
                statusSpan.textContent = 'Waiting...';
                readyElement.classList.remove('ready');
            }
        }
        
        console.log(`Ready states - Me: ${this.isReady}, Other: ${this.otherPlayerReady}`);
        this.checkGameStart();
    }

    checkGameStart() {
        // Only show countdown, but do not launch game locally
        if (this.isReady && this.otherPlayerReady) {
            this.startGameCountdown();
        } else {
            this.cancelGameCountdown();
        }
    }

    startGameCountdown() {
        const autoStartInfo = document.getElementById('autoStartInfo');
        const countdownSpan = document.getElementById('countdown');
        
        autoStartInfo.style.display = 'block';
        
        let countdown = 3;
        countdownSpan.textContent = countdown;
        
        this.gameStartCountdown = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownSpan.textContent = countdown;
            } else {
                this.cancelGameCountdown();
                // Do NOT call this.launchGame() here; wait for server 'game_start'
            }
        }, 1000);
    }

    cancelGameCountdown() {
        if (this.gameStartCountdown) {
            clearInterval(this.gameStartCountdown);
            this.gameStartCountdown = null;
        }
        document.getElementById('autoStartInfo').style.display = 'none';
    }

    startGame(data) {
        console.log('startGame called with data:', data);
        // Use the gameType from the server event for perfect sync
        this.launchGame(data && data.gameType);
    }

    launchGame(gameType) {
        console.log('launchGame called with gameType:', gameType);
        // Navigate to the selected game
        const gameUrls = {
            'ludo': 'pages/ludo.html',
            'isto': 'pages/isto.html',
            'carrom': 'pages/carrom.html',
            'tictactoe': 'pages/tictactoe.html',
            'snake': 'pages/snake.html',
            'dotjoin': 'pages/dotjoin.html'
        };
        const game = gameType || this.selectedGame;
        console.log('Final game to launch:', game);
        if (gameUrls[game]) {
            console.log('Navigating to:', gameUrls[game]);
            window.location.href = gameUrls[game];
        } else {
            console.error('No URL found for game:', game);
        }
    }

    updatePlayersStatus(data) {
        // Update player status indicators in login screen
        Object.keys(data).forEach(player => {
            const statusElement = document.getElementById(`${player}Status`);
            if (statusElement) {
                if (data[player].online) {
                    statusElement.textContent = 'Online';
                    statusElement.classList.remove('offline');
                    statusElement.classList.add('online');
                } else {
                    statusElement.textContent = 'Offline';
                    statusElement.classList.remove('online');
                    statusElement.classList.add('offline');
                }
            }
            
            // Update main screen status indicators
            const mainStatusElement = document.getElementById(`${player}StatusMain`);
            if (mainStatusElement) {
                if (data[player].online) {
                    mainStatusElement.textContent = 'Online';
                    mainStatusElement.classList.remove('offline');
                    mainStatusElement.classList.add('online');
                } else {
                    mainStatusElement.textContent = 'Offline';
                    mainStatusElement.classList.remove('online');
                    mainStatusElement.classList.add('offline');
                }
            }
        });
        
        // Update online indicator
        const onlineIndicator = document.getElementById('onlineIndicator');
        const statusDot = onlineIndicator.querySelector('.status-dot');
        const statusText = onlineIndicator.querySelector('.status-text');
        
        if (this.currentPlayer && data[this.currentPlayer] && data[this.currentPlayer].online) {
            statusDot.classList.add('connected');
            const playerName = this.currentPlayer === 'madhav' ? 'Madhav' : 'Khushi';
            statusText.textContent = `${playerName} - Online`;
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Connecting...';
        }

        // Check if both players are online and show notification
        const madhavOnline = data.madhav && data.madhav.online;
        const khushiOnline = data.khushi && data.khushi.online;
        
        if (madhavOnline && khushiOnline && !this.bothPlayersNotified) {
            this.notifyBothPlayersOnline();
        }
    }

    notifyBothPlayersOnline() {
        this.bothPlayersNotified = true;
        
        const welcomeMessages = [
            "🎉 Both players are online! Time to have some fun! 🎮",
            "🚀 Madhav and Khushi are ready to play! Let's go! ✨",
            "🎯 Game time! Both players connected! 🔥",
            "🎊 The gaming duo is here! Choose your adventure! 🌟",
            "💫 Both legends are online! Time to play! 🎲"
        ];
        
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        this.addSystemMessage(randomMessage);
        this.showCelebrationAnimation();
    }

    updateConnectionStatus(status) {
        const statusText = document.getElementById('statusText');
        const connectionStatus = document.getElementById('connectionStatus');
        
        switch (status) {
            case 'connected':
                statusText.textContent = '✅ Connected';
                connectionStatus.classList.add('connected');
                connectionStatus.classList.remove('disconnected');
                break;
            case 'disconnected':
                statusText.textContent = '❌ Disconnected';
                connectionStatus.classList.add('disconnected');
                connectionStatus.classList.remove('connected');
                break;
            default:
                statusText.textContent = '🔄 Connecting...';
                connectionStatus.classList.remove('connected', 'disconnected');
        }
    }

    // Chat functionality
    toggleChat() {
        this.chatVisible = !this.chatVisible;
        const chatPanel = document.getElementById('chatPanel');
        
        if (this.chatVisible) {
            chatPanel.classList.add('active');
            this.resetMessageCount();
        } else {
            chatPanel.classList.remove('active');
        }
    }

    closeChat() {
        this.chatVisible = false;
        document.getElementById('chatPanel').classList.remove('active');
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        const messageData = {
            sender: this.currentPlayer,
            senderName: this.currentPlayer === 'madhav' ? 'Madhav' : 'Khushi',
            text: message,
            timestamp: new Date()
        };
        
        // Add message to chat
        this.addChatMessage(messageData, true);
        
        // Send to server
        if (this.socket) {
            this.socket.emit('chat_message', messageData);
        }
        
        chatInput.value = '';
    }

    receiveChatMessage(data) {
        if (data.sender !== this.currentPlayer) {
            this.addChatMessage(data, false);
            
            if (!this.chatVisible) {
                this.incrementMessageCount();
            }
        }
    }

    addChatMessage(messageData, isOwn) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        
        const time = new Date(messageData.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-sender">${messageData.senderName}</div>
            <div class="message-text">${this.escapeHtml(messageData.text)}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addEmoji(emoji) {
        const chatInput = document.getElementById('chatInput');
        chatInput.value += emoji;
        chatInput.focus();
    }

    incrementMessageCount() {
        this.messageCount++;
        const badge = document.getElementById('newMessageCount');
        badge.textContent = this.messageCount;
        badge.style.display = this.messageCount > 0 ? 'block' : 'none';
    }

    resetMessageCount() {
        this.messageCount = 0;
        const badge = document.getElementById('newMessageCount');
        badge.textContent = '0';
        badge.style.display = 'none';
    }

    addSystemMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system';
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-sender">🎮 MK Games</div>
            <div class="message-text">${message}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showCelebrationAnimation() {
        // Add a fun celebration effect
        const celebration = document.createElement('div');
        celebration.className = 'celebration-popup';
        celebration.innerHTML = '🎉✨🎮✨🎉';
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.parentNode.removeChild(celebration);
            }
        }, 3000);
    }

    // Enhanced emoji functionality with random reactions
    addRandomReaction() {
        const reactions = ['😄', '🎉', '🔥', '⚡', '🎯', '🌟', '💫', '✨'];
        const randomEmoji = reactions[Math.floor(Math.random() * reactions.length)];
        this.addEmoji(randomEmoji);
    }

    showLiveReaction(data) {
        const { emoji, name } = data;
        
        // Create floating emoji
        const reaction = document.createElement('div');
        reaction.className = 'live-reaction';
        reaction.innerHTML = `<span class="reaction-emoji">${emoji}</span>
                             <span class="reaction-name">${name}</span>`;
        
        document.body.appendChild(reaction);
        
        // Position randomly on screen
        const randomX = Math.floor(Math.random() * 70) + 15; // 15-85% of screen width
        const randomY = Math.floor(Math.random() * 70) + 5;  // 5-75% of screen height
        
        reaction.style.left = `${randomX}%`;
        reaction.style.top = `${randomY}%`;
        
        // Remove after animation
        setTimeout(() => {
            if (reaction.parentNode) {
                reaction.parentNode.removeChild(reaction);
            }
        }, 2000);
    }
    
    handleGameSelected(data) {
        const { player, gameType } = data;
        
        // If the other player selected a game, show a notification
        if (player !== this.currentPlayer) {
            const playerName = player === 'madhav' ? 'Madhav' : 'Khushi';
            const gameName = this.getGameName(gameType);
            
            this.addSystemMessage(`${playerName} selected ${gameName}! 🎮`);
        }
    }
    
    getGameName(gameType) {
        const gameNames = {
            'ludo': 'Ludo Classic',
            'isto': 'Isto',
            'carrom': 'Carrom Board',
            'tictactoe': 'Tic Tac Toe',
            'snake': 'Snakes & Ladders',
            'dotjoin': 'Dot Connect'
        };
        return gameNames[gameType] || gameType;
    }

    // Quick emoji shortcuts
    setupEmojiShortcuts() {
        document.getElementById('chatInput').addEventListener('input', (e) => {
            // Replace text shortcuts with emojis
            const input = e.target;
            let value = input.value;
            
            // Replace common text with emojis
            const replacements = {
                ':)': '😊',
                ':D': '😄',
                ':(': '😢',
                ':P': '😜',
                '<3': '❤️',
                'gg': '🎉 GG 🎉',
                'lol': '😂',
                'wow': '😮',
                'cool': '😎',
                'fire': '🔥',
                'win': '🏆',
                'lose': '😭',
                ':thumbsup:': '👍',
                ':thumbsdown:': '👎',
                ':clap:': '👏',
                ':star:': '⭐',
                ':wave:': '👋',
                ':party:': '🎊',
                ':gift:': '🎁',
                ':cake:': '🎂'
            };
            
            for (const [text, emoji] of Object.entries(replacements)) {
                if (value.includes(text)) {
                    value = value.replace(text, emoji);
                    input.value = value;
                }
            }
        });

        // Ctrl + E for random emoji
        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.addRandomReaction();
            }
        });
    }

    showLoginScreen() {
        this.showScreen('loginScreen');
    }

    showGameSelection() {
        this.showScreen('mainScreen');
    }

    showLobby() {
        this.showScreen('lobbyScreen');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    handleGameReady(data) {
        const { gameType, players } = data;
        
        this.addSystemMessage(`Both players are ready! Game starting soon... 🎮`);
        
        // The countdown is handled automatically by the UI when both players are ready
    }

    startGame(data) {
        console.log('startGame called with data:', data);
        // Use the gameType from the server event for perfect sync
        this.launchGame(data && data.gameType);
    }

    launchGame(gameType) {
        console.log('launchGame called with gameType:', gameType);
        // Navigate to the selected game
        const gameUrls = {
            'ludo': 'pages/ludo.html',
            'isto': 'pages/isto.html',
            'carrom': 'pages/carrom.html',
            'tictactoe': 'pages/tictactoe.html',
            'snake': 'pages/snake.html',
            'dotjoin': 'pages/dotjoin.html'
        };
        const game = gameType || this.selectedGame;
        console.log('Final game to launch:', game);
        if (gameUrls[game]) {
            console.log('Navigating to:', gameUrls[game]);
            window.location.href = gameUrls[game];
        } else {
            console.error('No URL found for game:', game);
        }
    }

    showAlert(message) {
        alert(message);
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    updatePlayerReadyDisplay() {
        // Reset both player ready displays
        ['madhav', 'khushi'].forEach(player => {
            const readyElement = document.getElementById(`${player}Ready`);
            if (readyElement) {
                const statusSpan = readyElement.querySelector('.ready-status');
                statusSpan.textContent = 'Waiting...';
                readyElement.classList.remove('ready');
            }
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.mkGamesApp = new MKGamesApp();
});