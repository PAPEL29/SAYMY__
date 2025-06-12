// Efectos de sonido arcade
const SoundEffects = {
    
    init: function() {
        this.sounds = {
            start: 'https://assets.mixkit.co/sfx/preview/mixkit-game-show-suspense-waiting-668.mp3',
            correct: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
            wrong: 'https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-lose-2027.mp3',
            typing: 'https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3',
            victory: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
            join: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-video-game-bonus-2044.mp3',
            countdown: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-explosion-1699.mp3',
            message: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-ui-notification-211.mp3',
        notification: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-notification-2068.mp3'
        };
        
        // Precargar sonidos
        this.audioElements = {};
        for (const [key, url] of Object.entries(this.sounds)) {
            this.audioElements[key] = new Audio(url);
            this.audioElements[key].volume = 0.3;
        }
    },
    
    play: function(type) {
        if (this.audioElements[type]) {
            this.audioElements[type].currentTime = 0;
            this.audioElements[type].play().catch(e => console.log(`Audio error: ${e}`));
        }
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    SoundEffects.init();
});


// Para usar en el juego:
// SoundEffects.play('correct');
// SoundEffects.play('wrong');