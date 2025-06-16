// public/player2.js
const socket = io();

let currentText = '';
const gameState = {
    gameId: '',
    playerName: '',
    connected: false,
    timer: null,
    timeLeft: 60
};

document.getElementById('join-btn').addEventListener('click', () => {
    gameState.gameId = document.getElementById('game-id').value.trim().toUpperCase();
    gameState.playerName = document.getElementById('player-name').value.trim();
    
    if (!gameState.gameId || !gameState.playerName) {
        alert('Please enter both room code and your name');
        return;
    }
    
    socket.emit('joinGame', gameState.gameId, gameState.playerName);
});
document.getElementById('submit-answer').addEventListener('click', () => {
    if (!gameState.connected) {
        alert('Complete the join process first');
        return;
    }
    
    const answer = document.getElementById('answer-input').value.trim();
    
    if (!answer) {
        alert('Please enter your answer');
        return;
    }
    
    socket.emit('submitAnswer', gameState.gameId, answer);
    SoundEffects.play('submit');
});

socket.on('roleAssigned', (role) => {
    playerRole = role;
});
socket.on('gameReady', () => {
    gameState.connected = true;
    document.getElementById('join-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    setupChat();
    startTimer(); // Iniciar temporizador al unirse
});

socket.on('textSelected', (data) => {
    currentText = data.fullText;
    document.getElementById('hidden-text').textContent = data.hiddenText;
    document.getElementById('player1-name').textContent = data.player1;
});

socket.on('newMessage', (data) => {
    if (data.playerName !== playerName) {
        addMessageToChat(data.playerName, data.message);
        SoundEffects.play('message');
    }
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
function setupChat() {
    const chatInput = document.getElementById('chat-message');
    
    document.getElementById('send-message').addEventListener('click', sendMessage);
    
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
            SoundEffects.play('message');
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
// Funciones del temporizador
function startTimer() {
    gameState.timeLeft = 60;
    updateTimerDisplay();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `TIME: ${gameState.timeLeft}`;
    
    // Cambiar color cuando el tiempo se acaba
    if (gameState.timeLeft <= 10) {
        timerElement.style.color = 'var(--neon-pink)';
        timerElement.style.animation = 'blink 0.5s infinite';
    } else {
        timerElement.style.color = 'var(--neon-blue)';
        timerElement.style.animation = 'none';
    }
}

function handleTimeUp() {
    alert('Time is up! Your turn has ended.');
    document.getElementById('submit-answer').disabled = true;
    socket.emit('timeUp', gameState.gameId);
}

// Reiniciar temporizador para nueva ronda
socket.on('prepareNextRound', () => {
    clearInterval(gameState.timer);
    document.getElementById('submit-answer').disabled = false;
    startTimer();
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
    // Actualizar interfaz
    document.getElementById('hidden-text').textContent = data.hiddenText;
    document.getElementById('answer-input').value = '';
    
    // Reiniciar temporizador
    clearInterval(gameState.timer);
    gameState.timeLeft = 60;
    updateTimerDisplay();
    startTimer();
    
    // Actualizar marcador
    document.getElementById('player1-score').textContent = data.scores.player1;
    document.getElementById('player2-score').textContent = data.scores.player2;
    
    // Mostrar notificación
    if (gameState.role === 'guesser') {
        alert(`New phrase ready! Round ${data.round} of ${gameState.maxRounds}`);
    }
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