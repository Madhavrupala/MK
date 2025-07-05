// Dot Connect Game Logic
class DotConnectGame {
    constructor() {
        this.gridSize = 5; // 5x5 grid of dots
        this.players = [
            { id: 1, name: 'Player 1', color: '#3b82f6', score: 0 },
            { id: 2, name: 'Player 2', color: '#ef4444', score: 0 }
        ];
        this.currentPlayer = 0;
        this.gameStarted = false;
        this.gameEnded = false;
        this.lines = new Set();
        this.squares = [];
        this.board = null;
        this.timer = 300; // 5 minutes
        this.timerInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createBoard();
        this.showRulesModal();
        this.updatePlayerDisplay();
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.goBack();
        });

        // Control buttons
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('chatBtn').addEventListener('click', () => {
            this.toggleChat();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('surrenderBtn').addEventListener('click', () => {
            this.surrender();
        });

        // Modal buttons
        document.getElementById('closeRulesBtn').addEventListener('click', () => {
            this.hideRulesModal();
        });

        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Chat functionality
        document.getElementById('closeChatBtn').addEventListener('click', () => {
            this.hideChat();
        });

        document.getElementById('sendChatBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Game result modal
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.playAgain();
        });

        document.getElementById('backToLobbyBtn').addEventListener('click', () => {
            this.backToLobby();
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    createBoard() {
        const svg = document.getElementById('gameBoard');
        const size = 400;
        const spacing = size / (this.gridSize - 1);
        
        svg.innerHTML = '';
        
        // Create lines first (so they appear behind dots)
        this.createLines(svg, spacing);
        
        // Create dots
        this.createDots(svg, spacing);
    }

    createDots(svg, spacing) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', col * spacing);
                dot.setAttribute('cy', row * spacing);
                dot.setAttribute('r', 8);
                dot.classList.add('dot');
                dot.dataset.row = row;
                dot.dataset.col = col;
                
                svg.appendChild(dot);
            }
        }
    }

    createLines(svg, spacing) {
        // Horizontal lines
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 1; col++) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', col * spacing);
                line.setAttribute('y1', row * spacing);
                line.setAttribute('x2', (col + 1) * spacing);
                line.setAttribute('y2', row * spacing);
                line.classList.add('line', 'horizontal');
                line.dataset.row = row;
                line.dataset.col = col;
                
                line.addEventListener('click', () => {
                    this.drawLine(line, 'horizontal', row, col);
                });
                
                svg.appendChild(line);
            }
        }

        // Vertical lines
        for (let row = 0; row < this.gridSize - 1; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', col * spacing);
                line.setAttribute('y1', row * spacing);
                line.setAttribute('x2', col * spacing);
                line.setAttribute('y2', (row + 1) * spacing);
                line.classList.add('line', 'vertical');
                line.dataset.row = row;
                line.dataset.col = col;
                
                line.addEventListener('click', () => {
                    this.drawLine(line, 'vertical', row, col);
                });
                
                svg.appendChild(line);
            }
        }
    }

    drawLine(lineElement, direction, row, col) {
        if (!this.gameStarted || this.gameEnded) return;
        if (lineElement.classList.contains('drawn')) return;

        const lineId = `${direction}-${row}-${col}`;
        if (this.lines.has(lineId)) return;

        // Draw the line
        lineElement.classList.add('drawn', `player${this.players[this.currentPlayer].id}`);
        this.lines.add(lineId);

        // Add drawing animation
        lineElement.style.strokeDasharray = '100';
        lineElement.style.strokeDashoffset = '100';
        lineElement.classList.add('line-draw');
        
        setTimeout(() => {
            lineElement.style.strokeDasharray = 'none';
            lineElement.style.strokeDashoffset = 'none';
            lineElement.classList.remove('line-draw');
        }, 300);

        // Check for completed squares
        const completedSquares = this.checkCompletedSquares(direction, row, col);
        
        if (completedSquares.length > 0) {
            // Player gets another turn for completing squares
            this.players[this.currentPlayer].score += completedSquares.length;
            this.createSquareElements(completedSquares);
            this.updatePlayerDisplay();
            
            // Check if game is over
            if (this.isGameOver()) {
                this.endGame();
                return;
            }
        } else {
            // Switch to next player
            this.switchPlayer();
        }

        // Send move to other players (if multiplayer)
        this.sendMove(direction, row, col);
    }

    checkCompletedSquares(direction, row, col) {
        const completedSquares = [];
        
        // Check squares that could be completed by this line
        if (direction === 'horizontal') {
            // Check square above
            if (row > 0) {
                if (this.isSquareComplete(row - 1, col)) {
                    completedSquares.push({ row: row - 1, col: col });
                }
            }
            // Check square below
            if (row < this.gridSize - 1) {
                if (this.isSquareComplete(row, col)) {
                    completedSquares.push({ row: row, col: col });
                }
            }
        } else { // vertical
            // Check square to the left
            if (col > 0) {
                if (this.isSquareComplete(row, col - 1)) {
                    completedSquares.push({ row: row, col: col - 1 });
                }
            }
            // Check square to the right
            if (col < this.gridSize - 1) {
                if (this.isSquareComplete(row, col)) {
                    completedSquares.push({ row: row, col: col });
                }
            }
        }
        
        return completedSquares.filter(square => 
            !this.squares.some(s => s.row === square.row && s.col === square.col)
        );
    }

    isSquareComplete(row, col) {
        // Check if all four lines of a square are drawn
        const top = this.lines.has(`horizontal-${row}-${col}`);
        const bottom = this.lines.has(`horizontal-${row + 1}-${col}`);
        const left = this.lines.has(`vertical-${row}-${col}`);
        const right = this.lines.has(`vertical-${row}-${col + 1}`);
        
        return top && bottom && left && right;
    }

    createSquareElements(newSquares) {
        const svg = document.getElementById('gameBoard');
        const spacing = 400 / (this.gridSize - 1);
        
        newSquares.forEach(square => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', square.col * spacing + 4);
            rect.setAttribute('y', square.row * spacing + 4);
            rect.setAttribute('width', spacing - 8);
            rect.setAttribute('height', spacing - 8);
            rect.classList.add('square', `player${this.players[this.currentPlayer].id}`, 'square-complete');
            
            svg.appendChild(rect);
            this.squares.push({ ...square, player: this.currentPlayer });
        });
    }

    switchPlayer() {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        this.updatePlayerDisplay();
    }

    updatePlayerDisplay() {
        // Update player cards
        this.players.forEach((player, index) => {
            const card = document.getElementById(`player${index + 1}`);
            const nameEl = card.querySelector('.player-name');
            const scoreEl = card.querySelector('.player-score');
            
            nameEl.textContent = player.name;
            scoreEl.textContent = `${player.score} squares`;
            
            if (index === this.currentPlayer) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Update turn indicator
        const turnIndicator = document.getElementById('currentTurn');
        if (this.gameStarted && !this.gameEnded) {
            turnIndicator.textContent = `${this.players[this.currentPlayer].name}'s Turn`;
        }
    }

    startGame() {
        this.hideRulesModal();
        this.gameStarted = true;
        this.startTimer();
        this.updatePlayerDisplay();
        
        // Hide loading screen
        document.getElementById('loadingScreen').classList.add('hidden');
        
        // Add some sample chat messages
        this.addChatMessage('System', 'Game started! Good luck!', 'system');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.updateTimerDisplay();
            
            if (this.timer <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = display;
    }

    isGameOver() {
        const maxPossibleSquares = (this.gridSize - 1) * (this.gridSize - 1);
        const totalSquares = this.squares.length;
        return totalSquares >= maxPossibleSquares;
    }

    endGame() {
        this.gameEnded = true;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Determine winner
        const winner = this.players.reduce((prev, current) => 
            prev.score > current.score ? prev : current
        );

        // Show result modal
        this.showGameResult(winner);
    }

    showGameResult(winner) {
        const modal = document.getElementById('gameResultModal');
        const winnerName = document.getElementById('winnerName');
        const finalScore = document.getElementById('finalScore');
        const gameDuration = document.getElementById('gameDuration');
        const totalMoves = document.getElementById('totalMoves');

        if (this.players[0].score === this.players[1].score) {
            winnerName.textContent = "It's a Tie!";
        } else {
            winnerName.textContent = `${winner.name} Wins!`;
        }

        finalScore.textContent = `Final Score: ${this.players[0].score} - ${this.players[1].score}`;
        
        const elapsed = 300 - this.timer;
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        gameDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        totalMoves.textContent = this.lines.size.toString();

        modal.classList.add('active');
    }

    togglePause() {
        if (!this.gameStarted || this.gameEnded) return;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            document.getElementById('pauseBtn').innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Resume</span>';
        } else {
            this.startTimer();
            document.getElementById('pauseBtn').innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">Pause</span>';
        }
    }

    toggleChat() {
        const chatPanel = document.getElementById('chatPanel');
        chatPanel.classList.toggle('active');
    }

    hideChat() {
        document.getElementById('chatPanel').classList.remove('active');
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.addChatMessage(this.players[this.currentPlayer].name, message, 'own');
            input.value = '';
            
            // Send to other players (if multiplayer)
            // this.socket.emit('chat_message', { message });
        }
    }

    addChatMessage(sender, message, type = 'opponent') {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.classList.add('chat-message', type);
        
        messageEl.innerHTML = `
            <div class="message-sender">${sender}</div>
            <div class="message-text">${message}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showHint() {
        if (!this.gameStarted || this.gameEnded) return;
        
        // Find a line that would complete a square
        const hints = this.findHints();
        
        if (hints.length > 0) {
            const hint = hints[Math.floor(Math.random() * hints.length)];
            this.highlightHint(hint);
        } else {
            this.addChatMessage('System', 'No immediate square completions available. Look for strategic moves!', 'system');
        }
    }

    findHints() {
        const hints = [];
        
        // Check all possible lines
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 1; col++) {
                const lineId = `horizontal-${row}-${col}`;
                if (!this.lines.has(lineId)) {
                    // Check if this line would complete a square
                    if (this.wouldCompleteSquare('horizontal', row, col)) {
                        hints.push({ direction: 'horizontal', row, col });
                    }
                }
            }
        }
        
        for (let row = 0; row < this.gridSize - 1; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const lineId = `vertical-${row}-${col}`;
                if (!this.lines.has(lineId)) {
                    if (this.wouldCompleteSquare('vertical', row, col)) {
                        hints.push({ direction: 'vertical', row, col });
                    }
                }
            }
        }
        
        return hints;
    }

    wouldCompleteSquare(direction, row, col) {
        const tempLines = new Set(this.lines);
        tempLines.add(`${direction}-${row}-${col}`);
        
        // Check if any square would be completed
        if (direction === 'horizontal') {
            if (row > 0 && this.wouldSquareBeComplete(row - 1, col, tempLines)) return true;
            if (row < this.gridSize - 1 && this.wouldSquareBeComplete(row, col, tempLines)) return true;
        } else {
            if (col > 0 && this.wouldSquareBeComplete(row, col - 1, tempLines)) return true;
            if (col < this.gridSize - 1 && this.wouldSquareBeComplete(row, col, tempLines)) return true;
        }
        
        return false;
    }

    wouldSquareBeComplete(row, col, lines) {
        const top = lines.has(`horizontal-${row}-${col}`);
        const bottom = lines.has(`horizontal-${row + 1}-${col}`);
        const left = lines.has(`vertical-${row}-${col}`);
        const right = lines.has(`vertical-${row}-${col + 1}`);
        
        return top && bottom && left && right;
    }

    highlightHint(hint) {
        const lines = document.querySelectorAll('.line');
        lines.forEach(line => {
            if (line.classList.contains(hint.direction) && 
                line.dataset.row == hint.row && 
                line.dataset.col == hint.col) {
                line.style.stroke = '#fbbf24';
                line.style.strokeWidth = '6';
                line.style.opacity = '0.8';
                
                setTimeout(() => {
                    line.style.stroke = '';
                    line.style.strokeWidth = '';
                    line.style.opacity = '';
                }, 2000);
            }
        });
    }

    surrender() {
        if (!this.gameStarted || this.gameEnded) return;
        
        if (confirm('Are you sure you want to surrender?')) {
            this.gameEnded = true;
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            
            // Other player wins
            const otherPlayer = this.players[(this.currentPlayer + 1) % this.players.length];
            this.showGameResult(otherPlayer);
        }
    }

    playAgain() {
        // Reset game state
        this.currentPlayer = 0;
        this.gameStarted = false;
        this.gameEnded = false;
        this.lines.clear();
        this.squares = [];
        this.timer = 300;
        
        // Reset player scores
        this.players.forEach(player => player.score = 0);
        
        // Recreate board
        this.createBoard();
        this.updatePlayerDisplay();
        
        // Hide result modal and show rules
        document.getElementById('gameResultModal').classList.remove('active');
        this.showRulesModal();
    }

    backToLobby() {
        this.cleanup();
        window.location.href = '../index.html';
    }

    goBack() {
        if (this.gameStarted && !this.gameEnded) {
            if (confirm('Are you sure you want to leave the game?')) {
                this.cleanup();
                window.location.href = '../index.html';
            }
        } else {
            this.cleanup();
            window.location.href = '../index.html';
        }
    }

    showRulesModal() {
        document.getElementById('rulesModal').classList.add('active');
    }

    hideRulesModal() {
        document.getElementById('rulesModal').classList.remove('active');
    }

    sendMove(direction, row, col) {
        // This would send the move to other players in a real multiplayer setup
        // socket.emit('game_move', { direction, row, col, player: this.currentPlayer });
    }

    cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dotConnectGame = new DotConnectGame();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DotConnectGame;
}
