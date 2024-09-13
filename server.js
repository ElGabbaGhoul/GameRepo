const express = require('express');
const http = require('http');
const {Server} = require('socket.io')

const app = express();
const server = http.createServer(app)
const io = new Server(server)


app.use(express.static('public'));
// Serve static files from the "public" folder

// TTT game state management
let games = {};
function createGame(roomId){
    games[roomId] = {
        board: Array(3).fill().map(() => Array(3).fill(null)), 
        currentPlayer: 'X',
    };
}

function handleMove(roomId, row, col) {
    const game = games[roomId]
    if (game.board[row][col] === null)
        {
            game.board[row][col] = game.currentPlayer;
            game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
            return game;
        }
    return null;
}

// Socket.IO handling
io.on('connection', (socket) => {
    let roomId;

    socket.on('createGame', () => {
        roomId = Math.random().toString(36).substring(2, 7); // Generates random room ID
        createGame(roomId);
        socket.join(roomId);
        socket.emit('gameCreated', roomId);
    });

    socket.on('joinGame', (id) => {
        roomId = id;
        socket.join(roomId);
        socket.emit('gameJoined', games[roomId]);
    });

    socket.on('makeMove', (row, col) => {
        const updatedGame = handleMove(roomId, row, col);
        if (updatedGame) {
            io.in(roomId).timeout('gameUpdate', updatedGame);
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000')
})