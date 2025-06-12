const socket = io();
let playerRole = 'player1';
let gameData = {};
let gameId = '';
let playerName = '';

document.getElementById('submit-text').addEventListener('click', () => {
    const text = document.getElementById('text-options').value;
    socket.emit('selectText', gameId, text);
});

socket.on('gameCreated', (id) => {
    gameId = id;
    console.log('ID del juego:', gameId);

    const qrCodeUrl = `http://localhost:3000/player2.html?gameId=${gameId}`;
    new QRCode(document.getElementById('qrcode'), {
        text: qrCodeUrl,
        width: 128,
        height: 128
    });

    document.getElementById('player1-section').style.display = 'block';
    document.getElementById('waiting-room').style.display = 'none';
    document.getElementById('role').textContent = 'Player 1';
});

socket.on('updateGame', (data) => {
    gameData = data;
    console.log('Datos del juego actualizados:', gameData);
});

socket.on('message', (data) => {
    console.log('Mensaje del servidor:', data);
});

function setupChat() {
    document.getElementById('send-chat').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function addMessageToChat(message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
}

function sendMessage() {
    const messageInput = document.getElementById('chat-input');
    const message = messageInput.value.trim();
    if (message !== '') {
        socket.emit('sendMessage', gameId, playerName, message);
        messageInput.value = '';
    }
}

socket.on('newMessage', (data) => {
    addMessageToChat(`${data.playerName}: ${data.message}`);
});

socket.on('playerName', (name) => {
    playerName = name;
    document.getElementById('player-name').textContent = `Tu nombre: ${playerName}`;
    setupChat();
});

socket.on('startNewRound', (data) => {
    gameData = data;
    console.log('Nueva ronda:', gameData);
});

socket.on('showOptions', (options) => {
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = 'option-button';
        button.addEventListener('click', () => {
            socket.emit('selectOption', gameId, playerRole, option);
        });
        optionsContainer.appendChild(button);
    });
});

socket.on('roleChanged', (newRole) => {
    playerRole = newRole;
    document.getElementById('role').textContent = `Rol: ${playerRole}`;
});

socket.on('newRolesAssigned', (data) => {
    setupForNewRole(data.newRoles);
});
