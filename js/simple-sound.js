/**
 * Simple Sound System - Direct Audio Playback
 */
class SimpleSoundManager {
    constructor() {
        this.sounds = {};
        this.currentSound = null;
        this.initialized = false;
    }

    init() {
        // Default sounds — only add if not already injected by dynamic-content.js
        // This prevents overwriting custom admin-uploaded audio with default files
        const soundFiles = {
            'countryside_hero': 'assets/audio/countryside_hero.mp3',
            'music': 'assets/audio/music_gentle.mp3',
            'rain': 'assets/audio/rain_roof.mp3',
            'ocean': 'assets/audio/ocean_waves.mp3',
            'waterfall': 'assets/audio/waterfall.mp3',
            'frogs_lake': 'assets/audio/frogs_lake.mp3',
            'birds': 'assets/audio/birds_1.mp3'
        };

        Object.keys(soundFiles).forEach(key => {
            if (!this.sounds[key]) {
                // Only create default if no custom audio was injected for this key
                const audio = new Audio(soundFiles[key]);
                audio.loop = true;
                audio.volume = 0.6;
                this.sounds[key] = audio;
                audio.load();
                console.log('Added default sound:', key);
            } else {
                console.log('Skipping default sound (custom already loaded):', key);
            }
        });

        this.initialized = true;
        console.log('SimpleSoundManager ready with sounds:', Object.keys(this.sounds));
    }

    play(soundId, volume = 1.0) {
        if (!this.initialized) {
            this.init();
        }

        // Stop current sound
        this.stopAll();

        // Play new sound
        const sound = this.sounds[soundId];
        if (sound) {
            sound.volume = volume;
            // Reset to beginning
            sound.currentTime = 0;
            // Try to play with promise handling
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Sound playing successfully:', soundId);
                }).catch(e => {
                    console.error('Play promise rejected:', e);
                    // Try again with a new Audio element
                    this.recreateAndPlay(soundId, volume);
                });
            }
            this.currentSound = soundId;
            console.log('Playing sound:', soundId, 'at volume:', volume);
        } else {
            console.warn('Sound not found:', soundId);
        }
    }

    recreateAndPlay(soundId, volume) {
        let srcToPlay = null;

        // Check if we already have this sound with a src we can reuse
        if (this.sounds[soundId] && this.sounds[soundId].src) {
            srcToPlay = this.sounds[soundId].src;
        } else {
            // Fallbacks for default hardcoded sounds if not dynamically loaded
            const soundFiles = {
                'countryside_hero': 'assets/audio/countryside_hero.mp3',
                'music': 'assets/audio/music_gentle.mp3',
                'rain': 'assets/audio/rain_roof.mp3',
                'ocean': 'assets/audio/ocean_waves.mp3',
                'waterfall': 'assets/audio/waterfall.mp3',
                'frogs_lake': 'assets/audio/frogs_lake.mp3',
                'birds': 'assets/audio/birds_1.mp3'
            };
            srcToPlay = soundFiles[soundId];
        }

        if (srcToPlay) {
            const audio = new Audio(srcToPlay);
            audio.loop = true;
            audio.volume = volume;
            this.sounds[soundId] = audio;
            audio.play().then(() => {
                console.log('Recreated and playing:', soundId);
            }).catch(e => {
                console.error('Failed to play recreated audio:', e);
            });
        }
    }

    stop(soundId) {
        const sound = this.sounds[soundId];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
            if (this.currentSound === soundId) {
                this.currentSound = null;
            }
            console.log('Stopped sound:', soundId);
        }
    }

    pause(soundId) {
        const sound = this.sounds[soundId];
        if (sound) {
            sound.pause();
            // Do NOT reset currentTime so play() resumes where it left off
            console.log('Paused sound:', soundId);
        }
    }

    stopAll() {
        Object.keys(this.sounds).forEach(key => {
            this.stop(key);
        });
    }
}

// Create global instance
window.simpleSoundManager = new SimpleSoundManager();

// Helper function called by dynamic-content.js to inject custom audio
window.updateSimpleSoundManager = function (soundId, src) {
    if (!window.simpleSoundManager.sounds) {
        window.simpleSoundManager.sounds = {};
    }

    // Stop it if currently playing before replacing
    if (window.simpleSoundManager.currentSound === soundId) {
        window.simpleSoundManager.stop(soundId);
    }

    // Create new audio element with new source
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.6; // Default volume, might be overridden by HTML data-target-vol
    audio.load(); // Preload so it's ready before play() is called
    window.simpleSoundManager.sounds[soundId] = audio;

    // Mark as initialized so init() won't overwrite this custom audio with defaults
    window.simpleSoundManager.initialized = true;

    console.log(`Updated sound '${soundId}' with custom source.`);
};
