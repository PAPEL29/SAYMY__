// public/player2.js
const socket = io();
let gameId;
let playerRole = 'player2';
let qrScanner = null;

document.getElementById('join-btn').addEventListener('click', () => {
    const gameId = document.getElementById('game-id').value.trim();
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!gameId || !playerName) {
        alert('Please enter both Game ID and your name');
        return;
    }
    
    socket.emit('joinGame', gameId, playerName);
});

document.getElementById('submit-answer').addEventListener('click', () => {
    const answer = document.getElementById('answer-input').value;
    socket.emit('submitAnswer', gameId, answer);
});

socket.on('roleAssigned', (role) => {
    playerRole = role;
});

socket.on('gameReady', () => {
    document.getElementById('join-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
});

socket.on('textSelected', (data) => {
    document.getElementById('player1-name').textContent = data.player1;
    document.getElementById('hidden-text').textContent = data.hiddenText;
});

socket.on('roundResult', (data) => {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    document.getElementById('scores').textContent = 
        `Jugador 1: ${data.scores.player1} - Jugador 2: ${data.scores.player2}`;
    document.getElementById('accuracy').textContent = data.accuracy;
    
    if (data.winner === playerRole) {
        // Mostrar que ganó el punto
    } else {
        // Mostrar que el otro jugador ganó el punto
    }
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

document.getElementById('scan-qr-btn').addEventListener('click', () => {
    const cameraContainer = document.getElementById('camera-preview');
    cameraContainer.style.display = 'block';
    
    // Usar la librería instascan (debes incluirla en tu HTML)
    if (typeof Instascan !== 'undefined') {
        qrScanner = new Instascan.Scanner({ video: cameraContainer });
        qrScanner.addListener('scan', function (content) {
            document.getElementById('game-id').value = content;
            qrScanner.stop();
            cameraContainer.style.display = 'none';
        });
        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                qrScanner.start(cameras[0]);
            } else {
                alert('No cameras found');
            }
        });
    } else {
        alert('QR Scanner not available');
    }
});
document.getElementById('scan-qr-btn').addEventListener('click', () => {
    const cameraContainer = document.getElementById('camera-preview');
    cameraContainer.style.display = 'block';
    
    // Usar la librería instascan (debes incluirla en tu HTML)
    if (typeof Instascan !== 'undefined') {
        qrScanner = new Instascan.Scanner({ video: cameraContainer });
        qrScanner.addListener('scan', function (content) {
            document.getElementById('game-id').value = content;
            qrScanner.stop();
            cameraContainer.style.display = 'none';
        });
        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                qrScanner.start(cameras[0]);
            } else {
                alert('No cameras found');
            }
        });
    } else {
        alert('QR Scanner not available');
    }
});
socket.on('joinError', (message) => {
    alert(`Error: ${message}`);
    SoundEffects.play('wrong');
});