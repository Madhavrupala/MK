// This file contains the game logic and functionality for the Tic Tac Toe game.

const TicTacToe = (function() {
    const board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;

    const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    const statusDisplay = document.querySelector('.game-status');

    const handleCellClick = (clickedCell, clickedCellIndex) => {
        if (board[clickedCellIndex] !== '' || !gameActive) {
            return;
        }

        board[clickedCellIndex] = currentPlayer;
        clickedCell.innerHTML = currentPlayer;

        checkResult();
    };

    const checkResult = () => {
        let roundWon = false;

        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (board[a] === '' || board[b] === '' || board[c] === '') {
                continue;
            }
            if (board[a] === board[b] && board[a] === board[c]) {
                roundWon = true;
                break;
            }
        }

        if (roundWon) {
            statusDisplay.innerHTML = `Player ${currentPlayer} has won!`;
            gameActive = false;
            return;
        }

        if (!board.includes('')) {
            statusDisplay.innerHTML = 'Game ended in a draw!';
            gameActive = false;
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusDisplay.innerHTML = `It's ${currentPlayer}'s turn`;
    };

    const restartGame = () => {
        gameActive = true;
        currentPlayer = 'X';
        board.fill('');
        document.querySelectorAll('.cell').forEach(cell => cell.innerHTML = '');
        statusDisplay.innerHTML = `It's ${currentPlayer}'s turn`;
    };

    return {
        handleCellClick,
        restartGame
    };
})();

document.querySelectorAll('.cell').forEach((cell, index) => {
    cell.addEventListener('click', () => TicTacToe.handleCellClick(cell, index));
});

document.querySelector('.restart-button').addEventListener('click', TicTacToe.restartGame);