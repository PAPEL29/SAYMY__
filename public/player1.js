// public/player1.js
const socket = io();
let gameId;
let playerRole = 'player1';
let gameData = {};

document.getElementById('submit-text').addEventListener('click', () => {
    const text = document.getElementById('text-options').value;
    socket.emit('selectText', gameId, text);
});

socket.on('gameCreated', (data) => {
    gameData = data;
    document.getElementById('game-id-display').textContent = data.gameId;
    document.getElementById('waiting-screen').classList.remove('hidden');
    document.getElementById('text-selection').classList.remove('hidden');
    
    // Generar QR code
    generateQRCode(data.gameId);
    
    // Copiar ID al portapapeles
    document.getElementById('copy-id-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(data.gameId).then(() => {
            alert('Game ID copied to clipboard!');
        });
    });
});

socket.on('gameReady', () => {
    // El juego está listo para comenzar
});

socket.on('textSelected', (data) => {
    document.getElementById('original-text').textContent = data.fullText;
    document.getElementById('hidden-text').textContent = data.hiddenText;
    document.getElementById('results-screen').classList.remove('hidden');
});

socket.on('roundResult', (data) => {
    document.getElementById('scores').textContent = 
        `Jugador 1: ${data.scores.player1} - Jugador 2: ${data.scores.player2}`;
    document.getElementById('accuracy').textContent = data.accuracy;
    
    if (data.winner === 'player1') {
        // Mostrar que ganó el punto
    } else {
        // Mostrar que el jugador 2 ganó el punto
    }
    
    document.getElementById('next-round').classList.remove('hidden');
});

socket.on('gameOver', (data) => {
    document.getElementById('final-result').textContent = 
        `Jugador 1: ${data.scores.player1} - Jugador 2: ${data.scores.player2}`;
    document.getElementById('game-over').classList.remove('hidden');
});
// Variables para el chat
let playerName = '';

// Obtener el nombre del jugador (modifica según tu implementación)
// Para player1:
playerName = document.getElementById('player-name')?.value || 'Jugador 1';
// Para player2:
playerName = document.getElementById('player-name')?.value || 'Jugador 2';

// Enviar mensaje
document.getElementById('send-message')?.addEventListener('click', () => {
    const messageInput = document.getElementById('chat-message');
    const message = messageInput.value.trim();
    
    if (message && gameId) {
        socket.emit('sendMessage', gameId, message, playerName);
        messageInput.value = '';
    }
});

// Permitir enviar con Enter
document.getElementById('chat-message')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('send-message').click();
    }
});

// Recibir mensajes
socket.on('newMessage', (data) => {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${data.playerName}:</strong> ${data.message} <small>(${data.timestamp})</small>`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (document.hidden) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
    }
});


socket.on('playerJoined', (playerName) => {
    document.getElementById('connection-status').textContent = `${playerName} has joined the game!`;
    SoundEffects.play('join');
});

// En el jugador
document.getElementById('chat-message').addEventListener('input', () => {
    socket.emit('typing', gameId, playerName);
});

// En el servidor
socket.on('typing', (gameId, playerName) => {
    socket.to(gameId).emit('userTyping', playerName);
});

// En el otro jugador
let typingTimeout;
socket.on('userTyping', (playerName) => {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.textContent = `${playerName} está escribiendo...`;
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        typingIndicator.textContent = '';
    }, 2000);
});
function generateQRCode(gameId) {
    const qrCodeElement = document.getElementById('qr-code');
    qrCodeElement.innerHTML = '';
    
    // Usar la librería qrcode.js (debes incluirla en tu HTML)
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrCodeElement, {
            text: gameId,
            width: 150,
            height: 150,
            colorDark: "#05d9e8",
            colorLight: "transparent",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}