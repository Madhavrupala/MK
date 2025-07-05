const express = require('express');
const router = express.Router();

// Simple game API routes
router.post('/create', (req, res) => {
    const { gameType, playerName } = req.body;
    const gameId = Math.random().toString(36).substr(2, 9);
    
    res.json({
        success: true,
        gameId: gameId,
        gameType: gameType,
        host: playerName,
        message: 'Game created successfully'
    });
});

router.post('/join', (req, res) => {
    const { gameId, playerName } = req.body;
    
    res.json({
        success: true,
        gameId: gameId,
        player: playerName,
        message: 'Joined game successfully'
    });
});

router.get('/state/:gameId', (req, res) => {
    const { gameId } = req.params;
    
    res.json({
        gameId: gameId,
        status: 'active',
        players: [],
        currentTurn: 0
    });
});

router.post('/move', (req, res) => {
    const { gameId, playerId, move } = req.body;
    
    res.json({
        success: true,
        gameId: gameId,
        move: move,
        message: 'Move processed successfully'
    });
});

module.exports = router;