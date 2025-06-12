// server/index.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

// Configurar Express para servir archivos estáticos
app.use(express.static('public'));




/////
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware para loggear requests (útil para debug)
app.use((req, res, next) => {
    console.log(`Serving ${req.method} request for ${req.url}`);
    next();
});
/////


// Ruta principal que sirve el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para el jugador 1
app.get('/player1', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/player1.html'));
});

// Ruta para el jugador 2
app.get('/player2', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/player2.html'));
});


// Almacén de juegos activos
const games = {};

io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);

    // Mover todos los eventos de socket dentro de este bloque
    socket.on('createGame', (customGameId, playerName) => {
    // Verificar si el ID ya existe
    if (games[customGameId]) {
        socket.emit('createError', 'Room code already in use');
        return;
    }
    
    games[customGameId] = new Game(customGameId, io);
    games[customGameId].addPlayer(socket.id, playerName, 'player1');
    socket.join(customGameId);
    
    socket.emit('gameCreated', {
        gameId: customGameId,
        playerId: socket.id
    });
});

    socket.on('joinGame', (gameId, playerName) => {
        if (games[gameId] && games[gameId].players.length === 1) {
            games[gameId].addPlayer(socket.id, playerName, 'player2');
            socket.join(gameId);
            io.to(gameId).emit('gameReady');
        } else {
            socket.emit('joinError', 'Juego no encontrado o lleno');
        }
    });

    socket.on('selectText', (gameId, text) => {
        if (games[gameId]) {
            games[gameId].setText(text);
        }
    });

    socket.on('submitAnswer', (gameId, answer) => {
        if (games[gameId]) {
            games[gameId].checkAnswer(socket.id, answer);
        }
    });

    // Evento de chat - DEBE estar dentro de io.on('connection')
    socket.on('sendMessage', (gameId, message, playerName) => {
        if (games[gameId]) {
            // Enviar el mensaje a todos en la sala del juego
            io.to(gameId).emit('newMessage', {
                playerName: playerName,
                message: message,
                timestamp: new Date().toLocaleTimeString()
            });
        }
    });
    socket.on('createError', (message) => {
    alert(`Error: ${message}`);
    SoundEffects.play('wrong');
});

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        // Limpiar juegos abandonados
    });
});

function generateGameId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});