// server/game.js
class Game {
    constructor(id, io) 
    {
        this.id = id;
        this.io = io;
        this.players = [];
        this.text = '';
        this.hiddenText = '';
        this.currentRound = 0;
        this.roundsPlayed = 0;
        this.totalRounds = 5; // 5 rondas por bando
        this.maxRounds = 3;
        this.scores = { player1: 0, player2: 0 };
        this.chatHistory = [];
        this.currentRound = 1;
        this.currentRoles = {
            player1: 'selector',
            player2: 'guesser'
        };
    }
    addChatMessage(playerName, message) {
        const chatMessage = {
            playerName,
            message,
            timestamp: new Date().toISOString()
        };
        this.chatHistory.push(chatMessage);
        
        // Mantener un límite de mensajes en el historial
        if (this.chatHistory.length > 100) {
            this.chatHistory.shift();
        }
        
        return chatMessage;
    }

    addPlayer(socketId, name, role) {
    this.players.push({ socketId, name, role });
    this.io.to(socketId).emit('roleAssigned', role);
    
    // Notificar al jugador 1 que alguien se unió
    if (role === 'player2' && this.players[0]) {
        this.io.to(this.players[0].socketId).emit('playerJoined', name);
    }
}

    setText(text) {
        this.text = text;
        this.hiddenText = this.generateHiddenText(text);
        this.io.to(this.id).emit('textSelected', {
            fullText: this.text,
            hiddenText: this.hiddenText,
            player1: this.players[0].name,
            player2: this.players[1].name
        });
    }

    generateHiddenText(text) {
        const words = text.split(' ');
        const totalWords = words.length;
        const wordsToHide = Math.floor(totalWords * 0.3); // Ocultar 30% de las palabras
        
        // Seleccionar palabras aleatorias para ocultar
        const hiddenIndices = new Set();
        while (hiddenIndices.size < wordsToHide) {
            const randomIndex = Math.floor(Math.random() * totalWords);
            if (words[randomIndex].length > 3) { // No ocultar palabras muy cortas
                hiddenIndices.add(randomIndex);
            }
        }
        
        // Crear texto con huecos
        return words.map((word, index) => 
            hiddenIndices.has(index) ? '_____' : word
        ).join(' ');
    }

       checkAnswer(playerId, answer) {
          this.roundsPlayed++;
        
        if (this.roundsPlayed >= this.totalRounds) {
            this.switchRoles();
        } else {
            this.currentRound++;
            this.io.to(this.id).emit('prepareNextRound');
        }

        const player = this.players.find(p => p.socketId === playerId);
        if (!player || player.role !== 'player2') {
            console.log('Invalid player trying to answer');
            return;
        }
        
        const userWords = answer.split(' ');
        const hiddenWords = this.hiddenText.split(' ');
        const originalWords = this.text.split(' ');
        
        let correctCount = 0;
        let filledCount = 0;
        
        for (let i = 0; i < hiddenWords.length; i++) {
            if (hiddenWords[i] === '_____') {
                filledCount++;
                if (userWords[i] && userWords[i].toLowerCase() === originalWords[i].toLowerCase()) {
                    correctCount++;
                }
            }
        }
        
        const accuracy = filledCount > 0 ? (correctCount / filledCount) : 0;
        const isSuccessful = accuracy >= 0.7; // 70% de precisión para ganar
        if (isSuccessful) {
            this.scores.player2++;
        } else {
            this.scores.player1++;
        }
        
        if (isSuccessful) {
            this.scores.player2++;
            this.io.to(this.id).emit('roundResult', {
                winner: 'player2',
                scores: this.scores,
                accuracy: Math.round(accuracy * 100)
            });
        } else {
            this.scores.player1++;
            this.io.to(this.id).emit('roundResult', {
                winner: 'player1',
                scores: this.scores,
                accuracy: Math.round(accuracy * 100)
            });
        }
        
        this.currentRound++;
        
        if (this.currentRound < this.maxRounds) {
            this.io.to(this.id).emit('prepareNextRound');
        } else {
            this.io.to(this.id).emit('gameOver', {
                scores: this.scores,
                winner: this.scores.player1 > this.scores.player2 ? 'player1' : 
                       this.scores.player2 > this.scores.player1 ? 'player2' : 'draw'
            });
        }

        
    }

    switchRoles() {
        // Intercambiar roles
        const newRoles = {
            player1: this.currentRoles.player2,
            player2: this.currentRoles.player1
        };
        
        this.currentRoles = newRoles;
        this.roundsPlayed = 0;
        this.currentRound = 1;

        // Notificar a los jugadores
        this.io.to(this.id).emit('rolesSwitched', {
            newRoles: this.currentRoles,
            scores: this.scores
        });
    }

     handleTimeUp() {

        this.roundsPlayed++;
        if (this.roundsPlayed >= this.totalRounds) {
            this.switchRoles();
        } else {
            this.currentRound++;
            this.io.to(this.id).emit('prepareNextRound');
        }
    


        this.scores.player1++; // Punto para jugador 1 por tiempo
        this.io.to(this.id).emit('roundResult', {
            winner: 'player1',
            scores: this.scores,
            accuracy: 0,
            reason: 'time'
        });
        
        this.currentRound++;
        if (this.currentRound < this.maxRounds) {
            this.io.to(this.id).emit('prepareNextRound');
        } else {
            this.io.to(this.id).emit('gameOver', {
                scores: this.scores,
                winner: this.scores.player1 > this.scores.player2 ? 'player1' : 
                       this.scores.player2 > this.scores.player1 ? 'player2' : 'draw'
            });
        }
        
    }
}

module.exports = Game;