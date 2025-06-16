// public/player1.js
const socket = io();
let playerRole = 'player1';
let gameData = {};
let gameId = '';
let playerName = '';

document.getElementById('submit-text').addEventListener('click', () => {
    const text = document.getElementById('text-options').value;
    socket.emit('selectText', gameId, text);
});

socket.on('gameCreated', (data) => {
    gameData = data;
     // Ocultar pantalla de creación
    document.getElementById('create-screen').classList.add('hidden');
    
    // Mostrar selector de palabras y chat
    document.getElementById('text-selection').classList.remove('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    
    // Configurar chat
    setupChat();
    
    // Generar QR code
    generateQRCode(data.gameId);
    
    // Copiar ID al portapapeles
    document.getElementById('copy-id-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(data.gameId).then(() => {
            alert('Game ID copied to clipboard!');
        });
    });
});

function setupChat() {
    const chatInput = document.getElementById('chat-message');
    
    // Enviar mensaje al hacer clic en el botón
    document.getElementById('send-message').addEventListener('click', sendMessage);
    
    // Enviar mensaje con Enter
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && gameId) {
            socket.emit('sendMessage', gameId, message, playerName);
            addMessageToChat(playerName, message, true);
            chatInput.value = '';
        }
    }
}

function addMessageToChat(name, message, isSelf = false) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isSelf ? 'self' : 'other'}`;
    
    messageElement.innerHTML = `
        <span class="chat-sender">${name}:</span>
        <span class="chat-text">${message}</span>
        <span class="chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

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


// Obtener el nombre del jugador (modifica según tu implementación)
// Para player1:
playerName = document.getElementById('player-name')?.value || 'Jugador 1';
// Para player2:
playerName = document.getElementById('player-name')?.value || 'Jugador 2';

// Enviar mensaje
// Chat mejorado
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-message');
const toggleChatBtn = document.getElementById('toggle-chat');

let isChatOpen = true;

// Alternar visibilidad del chat
toggleChatBtn.addEventListener('click', () => {
    isChatOpen = !isChatOpen;
    document.querySelector('.chat-body').style.display = isChatOpen ? 'block' : 'none';
    toggleChatBtn.textContent = isChatOpen ? '▼' : '▲';
});

// Enviar mensaje con Enter
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
function sendMessage() {
    const message = chatInput.value.trim();
    if (message && gameId) {
        socket.emit('sendMessage', gameId, message, playerName);
        addMessageToChat(playerName, message, true);
        chatInput.value = '';
    }
}

function addMessageToChat(name, message, isSelf = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isSelf ? 'self' : 'other'}`;
    
    messageElement.innerHTML = `
        <span class="chat-sender">${name}:</span>
        <span class="chat-text">${message}</span>
        <span class="chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
// Escuchar mensajes del servidor
socket.on('newMessage', (data) => {
    if (data.playerName !== playerName) {
        addMessageToChat(data.playerName, data.message);
        SoundEffects.play('message');
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
// Crear sala con código personalizado
document.getElementById('create-game-btn').addEventListener('click', () => {
    playerName = document.getElementById('player1-name').value.trim();
    gameId = document.getElementById('custom-game-id').value.trim().toUpperCase();
    
    if (!playerName || !gameId) {
        alert('Please enter both your name and a room code');
        return;
    }
    
    if (!/^[A-Z0-9]{4,6}$/.test(gameId)) {
        alert('Room code must be 4-6 letters/numbers');
        return;
    }
    
    socket.emit('createGame', gameId, playerName);
});
// Manejar cambio de roles
socket.on('rolesSwitched', (data) => {
    // Mostrar pantalla de transición
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('transition-screen').classList.remove('hidden');
    
    // Mostrar resumen
    document.getElementById('round-summary').innerHTML = `
        <h3>ROUNDS COMPLETED!</h3>
        <p>Player 1 (${data.newRoles.player1 === 'selector' ? 'Selector' : 'Guesser'}): ${data.scores.player1} points</p>
        <p>Player 2 (${data.newRoles.player2 === 'selector' ? 'Selector' : 'Guesser'}): ${data.scores.player2} points</p>
        <p>Now switching roles...</p>
    `;
    
    // Continuar después de 5 segundos
    setTimeout(() => {
        document.getElementById('transition-screen').classList.add('hidden');
        setupForNewRole(data.newRoles);
    }, 5000);
});

function setupForNewRole(roles) {
    const playerRole = roles[socket.id === gameState.player1Id ? 'player1' : 'player2'];
    
    if (playerRole === 'selector') {
        // Mostrar interfaz de selector
        document.getElementById('text-selection').classList.remove('hidden');
        document.getElementById('guessing-interface').classList.add('hidden');
    } else {
        // Mostrar interfaz de adivinador
        document.getElementById('text-selection').classList.add('hidden');
        document.getElementById('guessing-interface').classList.remove('hidden');
    }
    
    // Reiniciar temporizador
    clearInterval(gameState.timer);
    startTimer();
}
// Manejar nueva ronda
socket.on('newRound', (data) => {
    // Actualizar marcador
    document.getElementById('player1-score').textContent = data.scores.player1;
    document.getElementById('player2-score').textContent = data.scores.player2;
    
    // Mostrar nueva frase para selección
    if (gameState.role === 'selector') {
        document.getElementById('text-selection').classList.remove('hidden');
        document.getElementById('text-options').value = data.fullText;
    }
    
    // Actualizar contador de rondas
    document.getElementById('current-round').textContent = data.round;
    gameState.currentRound = data.round;
});
// Manejar fin del juego
socket.on('gameOver', (data) => {
    clearInterval(gameState.timer);
    
    // Mostrar pantalla final
    document.getElementById('final-score-1').textContent = data.scores.player1;
    document.getElementById('final-score-2').textContent = data.scores.player2;
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('restart-screen').classList.remove('hidden');
    
    // Configurar botón de reinicio
    document.getElementById('restart-btn').addEventListener('click', () => {
        location.reload(); // Recargar la página para reiniciar
    });
});