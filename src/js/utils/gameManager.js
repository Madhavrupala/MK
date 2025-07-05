// Game Manager Utility - Modern ES6+ Version
class GameManager {
    constructor() {
        this.currentGame = null;
        this.gameInstances = new Map();
        this.gameHistory = [];
        this.socket = null;
    }

    // Initialize socket connection
    setSocket(socket) {
        this.socket = socket;
        this.setupSocketListeners();
    }

    // Setup socket event listeners for game management
    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('game_started', (data) => {
            this.startGame(data.gameType, data);
        });

        this.socket.on('game_move', (data) => {
            if (this.currentGame && this.currentGame.handleOpponentMove) {
                this.currentGame.handleOpponentMove(data);
            }
        });

        this.socket.on('game_ended', (data) => {
            this.endGame(data);
        });
    }

    // Initialize a specific game
    async initGame(gameName, gameData = {}) {
        try {
            // Check if game instance exists
            if (this.gameInstances.has(gameName)) {
                this.currentGame = this.gameInstances.get(gameName);
            } else {
                // Create new game instance
                this.currentGame = await this.createGameInstance(gameName, gameData);
                this.gameInstances.set(gameName, this.currentGame);
            }

            // Initialize the game
            if (this.currentGame && this.currentGame.init) {
                this.currentGame.init(gameData);
            }

            return this.currentGame;
        } catch (error) {
            console.error(`Failed to initialize game ${gameName}:`, error);
            throw error;
        }
    }

    // Create a new game instance
    async createGameInstance(gameName, gameData) {
        switch (gameName.toLowerCase()) {
            case 'ludo':
                // Dynamic import for game modules
                const { default: LudoGame } = await import('../games/ludo.js').catch(() => ({ default: null }));
                return LudoGame ? new LudoGame(gameData) : this.createFallbackGame(gameName);

            case 'isto':
                const { default: IstoGame } = await import('../games/isto.js').catch(() => ({ default: null }));
                return IstoGame ? new IstoGame(gameData) : this.createFallbackGame(gameName);

            case 'carrom':
                const { default: CarromGame } = await import('../games/carrom.js').catch(() => ({ default: null }));
                return CarromGame ? new CarromGame(gameData) : this.createFallbackGame(gameName);

            case 'tictactoe':
                const { default: TicTacToeGame } = await import('../games/tictactoe.js').catch(() => ({ default: null }));
                return TicTacToeGame ? new TicTacToeGame(gameData) : this.createFallbackGame(gameName);

            case 'snake':
                const { default: SnakeGame } = await import('../games/snake.js').catch(() => ({ default: null }));
                return SnakeGame ? new SnakeGame(gameData) : this.createFallbackGame(gameName);

            case 'dotjoin':
                const { default: DotJoinGame } = await import('../games/dotjoin.js').catch(() => ({ default: null }));
                return DotJoinGame ? new DotJoinGame(gameData) : this.createFallbackGame(gameName);

            default:
                throw new Error(`Unknown game type: ${gameName}`);
        }
    }

    // Create a fallback game for cases where the game module isn't available
    createFallbackGame(gameName) {
        return {
            name: gameName,
            init: (data) => console.log(`Fallback game ${gameName} initialized`),
            start: () => console.log(`Fallback game ${gameName} started`),
            stop: () => console.log(`Fallback game ${gameName} stopped`),
            handleMove: (move) => console.log(`Fallback game ${gameName} move:`, move),
            handleOpponentMove: (move) => console.log(`Opponent move in ${gameName}:`, move)
        };
    }

    // Start a game
    async startGame(gameName, gameData = {}) {
        try {
            // Stop current game if running
            if (this.currentGame && this.currentGame.stop) {
                this.currentGame.stop();
            }

            // Initialize and start new game
            await this.initGame(gameName, gameData);
            
            if (this.currentGame && this.currentGame.start) {
                this.currentGame.start();
            }

            // Add to game history
            this.gameHistory.push({
                game: gameName,
                startTime: new Date(),
                gameData: gameData
            });

            console.log(`Game ${gameName} started successfully`);
            return this.currentGame;
        } catch (error) {
            console.error(`Failed to start game ${gameName}:`, error);
            throw error;
        }
    }

    // Switch to a different game
    async switchGame(newGameName, gameData = {}) {
        try {
            if (this.currentGame) {
                // Save current game state if possible
                if (this.currentGame.saveState) {
                    const state = this.currentGame.saveState();
                    console.log('Saved game state:', state);
                }

                // Stop current game
                if (this.currentGame.stop) {
                    this.currentGame.stop();
                }
            }

            // Start new game
            return await this.startGame(newGameName, gameData);
        } catch (error) {
            console.error(`Failed to switch to game ${newGameName}:`, error);
            throw error;
        }
    }

    // End current game
    endGame(gameResult = null) {
        if (this.currentGame) {
            if (this.currentGame.stop) {
                this.currentGame.stop();
            }

            // Update game history
            const lastGame = this.gameHistory[this.gameHistory.length - 1];
            if (lastGame) {
                lastGame.endTime = new Date();
                lastGame.result = gameResult;
                lastGame.duration = lastGame.endTime - lastGame.startTime;
            }

            console.log('Game ended:', gameResult);
        }
    }

    // Send move to other players
    sendMove(moveData) {
        if (this.socket) {
            this.socket.emit('game_move', {
                ...moveData,
                timestamp: new Date()
            });
        }
    }

    // Get current game instance
    getCurrentGame() {
        return this.currentGame;
    }

    // Get game history
    getGameHistory() {
        return this.gameHistory;
    }

    // Get available games
    getAvailableGames() {
        return [
            { id: 'ludo', name: 'Ludo Classic', icon: '🎲' },
            { id: 'isto', name: 'Isto', icon: '🏠' },
            { id: 'carrom', name: 'Carrom Board', icon: '⚫' },
            { id: 'tictactoe', name: 'Tic Tac Toe', icon: '❌' },
            { id: 'snake', name: 'Snakes & Ladders', icon: '🐍' },
            { id: 'dotjoin', name: 'Dot Connect', icon: '🔗' }
        ];
    }

    // Check if a game is currently running
    isGameRunning() {
        return this.currentGame !== null;
    }

    // Get game statistics
    getStats() {
        return {
            totalGames: this.gameHistory.length,
            currentGame: this.currentGame ? this.currentGame.name : null,
            gamesPlayed: this.gameHistory.reduce((acc, game) => {
                acc[game.game] = (acc[game.game] || 0) + 1;
                return acc;
            }, {}),
            totalPlayTime: this.gameHistory.reduce((total, game) => {
                return total + (game.duration || 0);
            }, 0)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
} else {
    window.GameManager = GameManager;
}