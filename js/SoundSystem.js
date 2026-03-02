/**
 * Advanced Sound Manager for Hs4all Website
 * File-based Audio Playback with Crossfading
 */

/**
 * Advanced Sound Manager for Hs4all Website
 * Hybrid System: File-based Audio with Procedural Fallback
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sounds = {}; // File based
        this.scenes = {}; // Procedural nodes
        this.currentSoundId = null;
        this.enabled = false;
        this.fadeTime = 1.5; // seconds for WebAudio, ms for HTML5
        this.activeFades = new Map(); // Track intervals for HTML5 audio
    }

    init() {
        if (this.initialized) return;

        // 1. Setup Web Audio API (for procedural fallback)
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0; // Start Muted
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }

        // 2. Setup File Assets
        const assets = {
            'workshop': 'assets/audio/workshop.mp3',
            'music': 'assets/audio/music_gentle.mp3',
            'click': 'assets/audio/click_fit.mp3',
            'birds_1': 'assets/audio/birds_1.mp3',
            'birds_2': 'assets/audio/birds_2.mp3',
            'birds_3': 'assets/audio/birds_3.mp3',
            'forest': 'assets/audio/nature_forest.mp3',
            'ocean': 'assets/audio/ocean_waves.mp3',
            'waterfall': 'assets/audio/waterfall.mp3',
            'rain': 'assets/audio/rain_roof.mp3',
            'frogs_lake': 'assets/audio/frogs_lake.mp3',
            'countryside_hero': 'assets/audio/countryside_hero.mp3',
            'typewriter': 'assets/audio/typewriter.mp3',
            'interior_snow': 'assets/audio/interior_snow.mp3',
            'interior_rain': 'assets/audio/interior_rain.mp3',
            'interior_seaside': 'assets/audio/interior_seaside.mp3',
            'interior_forest': 'assets/audio/interior_forest.mp3',
            'interior_waterfall': 'assets/audio/interior_waterfall.mp3'
        };

        for (const [key, src] of Object.entries(assets)) {
            const audio = new Audio(src);
            audio.loop = true;
            audio.volume = 0;
            // Mark as valid only if it loads (simple check)
            audio.addEventListener('canplaythrough', () => { audio.dataset.valid = 'true'; });
            audio.addEventListener('error', () => { audio.dataset.valid = 'false'; });
            this.sounds[key] = audio;
        }

        // Specific volume boosts
        if (this.sounds['frogs_lake']) this.sounds['frogs_lake'].dataset.targetVol = '1.0';
        if (this.sounds['countryside_hero']) this.sounds['countryside_hero'].dataset.targetVol = '1.0';
        if (this.sounds['ocean']) this.sounds['ocean'].dataset.targetVol = '0.7';

        this.initialized = true;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            if (this.masterGain) this.masterGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.5);
            console.log('Sound System Enabled');
        } else {
            if (this.masterGain) this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
            this.stopAll();
        }
        return this.enabled;
    }

    play(soundId, targetVol = null) {
        if (!this.enabled) return;

        // If same sound is already playing, just update volume if targetVol is provided
        if (this.currentSoundId === soundId) {
            if (targetVol !== null) {
                const audio = this.sounds[soundId];
                if (audio && audio.dataset.valid === 'true') {
                    this.fadeToVolume(audio, targetVol);
                } else if (this.ctx) {
                    const sceneName = this.getSceneName(soundId);
                    if (this.scenes[sceneName]) {
                        this.fadeProceduralTo(this.scenes[sceneName], targetVol);
                    }
                }
            }
            return;
        }

        console.log(`Switching to: ${soundId} (vol: ${targetVol})`);

        // Stop/Fade out current
        if (this.currentSoundId) {
            this.fadeOut(this.currentSoundId);
        }

        this.currentSoundId = soundId;
        this.fadeIn(soundId, targetVol);
    }

    stopAll() {
        if (this.currentSoundId) {
            this.fadeOut(this.currentSoundId);
        }
        this.currentSoundId = null;
    }

    stop(id) {
        this.fadeOut(id);
    }

    // --- Dynamic Audio Injection ---

    injectCustomAudio(soundId, src) {
        console.log(`Injecting custom audio for SoundManager: ${soundId}`);
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = 0;
        audio.dataset.valid = 'true'; // Force valid so fading uses file not procedural fallback
        this.sounds[soundId] = audio;
    }

    // --- Core Fading Logic (Hybrid) ---

    getSceneName(id) {
        const fallbackMap = {
            'workshop': 'forest',
            'music': 'forest',
            'click': 'forest',
            'birds_1': 'birds',
            'birds_2': 'birds',
            'birds_3': 'birds',
            'forest': 'forest',
            'ocean': 'seaside',
            'waterfall': 'waterfall',
            'rain': 'rain',
            'wind_birds': 'forest',
            'snowstorm': 'snowstorm',
            'frogs_lake': 'frogs',
            'frogs': 'frogs',
            'interior_snow': 'forest',
            'interior_rain': 'rain',
            'interior_seaside': 'seaside',
            'interior_forest': 'forest',
            'interior_waterfall': 'waterfall'
        };
        return fallbackMap[id] || 'forest';
    }

    fadeIn(id, targetVol = null) {
        const fileAudio = this.sounds[id];
        const useFile = fileAudio && fileAudio.dataset.valid === 'true';

        if (useFile) {
            this.fadeInFile(fileAudio, targetVol);
        } else {
            const sceneName = this.getSceneName(id);
            console.log(`FadeIn requested for: ${id} -> Scene: ${sceneName} (vol: ${targetVol})`);
            this.playProceduralScene(sceneName, targetVol !== null ? targetVol : 1.0);
        }
    }

    fadeOut(id) {
        const fileAudio = this.sounds[id];
        // Fade out file
        if (fileAudio) this.fadeOutFile(fileAudio);

        // Also fade out any active procedural scene
        this.stopAllProcedural();
    }

    // --- File Implementations ---

    fadeInFile(audio, providedTargetVol = null) {
        if (this.activeFades.has(audio)) {
            clearInterval(this.activeFades.get(audio));
            this.activeFades.delete(audio);
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.warn('Audio play failed', e));
        }

        audio.volume = 0;

        // Dynamic volume based on trigger context
        let targetVol = providedTargetVol;
        if (targetVol === null) {
            targetVol = 0.6;
            const activeTrigger = document.querySelector(`.sound-trigger[data-sound="${this.currentSoundId}"], .comparison-card[data-sound="${this.currentSoundId}"]`);
            if (activeTrigger && activeTrigger.dataset.targetVol) {
                targetVol = parseFloat(activeTrigger.dataset.targetVol);
            } else if (audio.dataset.targetVol) {
                targetVol = parseFloat(audio.dataset.targetVol);
            }
        }

        const duration = 1000; // ms
        const steps = 20;
        const stepTime = duration / steps;
        const volStep = targetVol / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            if (audio.volume < targetVol) {
                audio.volume = Math.min(targetVol, audio.volume + volStep);
            }
            if (currentStep >= steps) {
                clearInterval(interval);
                this.activeFades.delete(audio);
            }
        }, stepTime);

        this.activeFades.set(audio, interval);
    }

    fadeToVolume(audio, targetVol) {
        if (this.activeFades.has(audio)) {
            clearInterval(this.activeFades.get(audio));
            this.activeFades.delete(audio);
        }

        const startVol = audio.volume;
        const diff = targetVol - startVol;
        if (Math.abs(diff) < 0.01) return;

        const duration = 800; // Faster transition for internal switches
        const steps = 20;
        const stepTime = duration / steps;
        const volStep = diff / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, Math.min(1, audio.volume + volStep));

            if (currentStep >= steps) {
                audio.volume = targetVol;
                clearInterval(interval);
                this.activeFades.delete(audio);
            }
        }, stepTime);

        this.activeFades.set(audio, interval);
    }

    fadeOutFile(audio) {
        if (this.activeFades.has(audio)) {
            clearInterval(this.activeFades.get(audio));
            this.activeFades.delete(audio);
        }

        const startVol = audio.volume;
        const duration = 1000;
        const steps = 20;
        const stepTime = duration / steps;
        const volStep = startVol / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            if (audio.volume > 0) {
                audio.volume = Math.max(0, audio.volume - volStep);
            }

            if (currentStep >= steps) {
                clearInterval(interval);
                audio.pause();
                audio.currentTime = 0;
                this.activeFades.delete(audio);
            }
        }, stepTime);

        this.activeFades.set(audio, interval);
    }

    // --- Procedural Implementations (Web Audio API) ---

    playProceduralScene(name, targetVol = 1.0) {
        if (!this.ctx) return;

        // Init scene if needed
        if (!this.scenes[name]) {
            this.scenes[name] = this.createSceneNodes(name);
        }

        const scene = this.scenes[name];

        // Restart intermittent loops if they are not already active
        if (name === 'frogs' && !scene.loopActive) {
            this.startFrogLoop(scene.gain);
            scene.loopActive = true;
        } else if (name === 'birds' && !scene.loopActive) {
            this.startBirdLoop(scene.gain, 'forest');
            scene.loopActive = true;
        } else if (name === 'wind_birds' && !scene.loopActive) {
            this.startBirdLoop(scene.gain, 'forest');
            scene.loopActive = true;
        }

        // Fade In
        console.log(`[SoundSystem] Fading procedural scene ${name} to ${targetVol}`);
        scene.gain.gain.cancelScheduledValues(this.ctx.currentTime);
        scene.gain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    }

    fadeProceduralTo(scene, targetVol) {
        if (!this.ctx) return;
        console.log(`[SoundSystem] Fading existing procedural scene to ${targetVol}`);
        scene.gain.gain.cancelScheduledValues(this.ctx.currentTime);
        scene.gain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    }

    stopAllProcedural() {
        if (!this.ctx) return;
        Object.values(this.scenes).forEach(scene => {
            scene.gain.gain.cancelScheduledValues(this.ctx.currentTime);
            scene.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
            // We don't stop the internal timeouts/loops for frogs/birds here, 
            // but the gain 0 will make them silent.
        });
    }

    createSceneNodes(name) {
        const sceneGain = this.ctx.createGain();
        sceneGain.gain.value = 0;
        sceneGain.connect(this.masterGain);
        const nodes = [];

        if (name === 'forest') {
            const wind = this.createWind(0.15);
            wind.connect(sceneGain);
            nodes.push(...wind.nodes);
            const leaves = this.createRustle(0.05);
            leaves.connect(sceneGain);
            nodes.push(...leaves.nodes);
        }
        else if (name === 'rain') {
            const rainBase = this.createPinkNoise();
            const rainFilter = this.ctx.createBiquadFilter();
            rainFilter.type = 'lowpass';
            rainFilter.frequency.value = 800;
            const rainGain = this.ctx.createGain();
            rainGain.gain.value = 0.4;
            rainBase.connect(rainFilter);
            rainFilter.connect(rainGain);
            rainGain.connect(sceneGain);

            const roofRain = this.createPinkNoise();
            const roofFilter = this.ctx.createBiquadFilter();
            roofFilter.type = 'lowpass';
            roofFilter.frequency.value = 300;
            const roofGain = this.ctx.createGain();
            roofGain.gain.value = 0.5;
            roofRain.connect(roofFilter);
            roofFilter.connect(roofGain);
            roofGain.connect(sceneGain);

            nodes.push(rainBase, rainGain, roofRain, roofGain);
        }
        else if (name === 'seaside') {
            const ocean = this.createOceanWaves(0.3);
            ocean.connect(sceneGain);
            nodes.push(...ocean.nodes);
            // Re-enabled seagull for "realism" request even in procedural
            this.startBirdLoop(sceneGain, 'seagull');
        }
        else if (name === 'waterfall') {
            const waterfall = this.createWaterfall(0.35);
            waterfall.connect(sceneGain);
            nodes.push(...waterfall.nodes);
        }
        else if (name === 'birds' || name === 'wind_birds') {
            const wind = this.createWind(0.1);
            wind.connect(sceneGain);
            nodes.push(...wind.nodes);
        }
        else if (name === 'frogs') {
            // Add a strong base layer of forest/lake ambiance
            const wind = this.createWind(0.2); // Doubled from 0.1
            wind.connect(sceneGain);
            nodes.push(...wind.nodes);
            const leaves = this.createRustle(0.15); // Tripled from 0.05
            leaves.connect(sceneGain);
            nodes.push(...leaves.nodes);
            // Add a subtle water ripple sound
            const waterRipple = this.createPinkNoise();
            const rippleFilter = this.ctx.createBiquadFilter();
            rippleFilter.type = 'bandpass';
            rippleFilter.frequency.value = 200;
            rippleFilter.Q.value = 2;
            const rippleGain = this.ctx.createGain();
            rippleGain.gain.value = 0.03;
            waterRipple.connect(rippleFilter);
            rippleFilter.connect(rippleGain);
            rippleGain.connect(sceneGain);
            nodes.push(waterRipple, rippleFilter, rippleGain);
        }
        else if (name === 'snowstorm') {
            const wind = this.createWind(0.4); // Even stronger wind
            wind.connect(sceneGain);
            nodes.push(...wind.nodes);

            // Add a "shivering" high-frequency whistle
            const whistle = this.createPinkNoise();
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2500;
            filter.Q.value = 8;
            const gain = this.ctx.createGain();
            gain.gain.value = 0.08;
            whistle.connect(filter);
            filter.connect(gain);
            gain.connect(sceneGain);
            nodes.push(whistle, filter, gain);
        }

        return { gain: sceneGain, nodes: nodes };
    }

    // --- Generators ---

    createPinkNoise() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        noise.start(0);
        return noise;
    }

    createWind(volume) {
        const noise = this.createPinkNoise();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 0.1;
        const oscGain = this.ctx.createGain();
        oscGain.gain.value = 200;
        osc.connect(oscGain);
        oscGain.connect(filter.frequency);
        osc.start();
        noise.connect(filter);
        filter.connect(gain);
        return { connect: (d) => gain.connect(d), nodes: [noise, filter, gain, osc, oscGain] };
    }

    createRustle(volume) {
        const noise = this.createPinkNoise();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        noise.connect(filter);
        filter.connect(gain);
        return { connect: (d) => gain.connect(d), nodes: [noise, filter, gain] };
    }

    createOceanWaves(volume) {
        const noise = this.createPinkNoise();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        const volLfo = this.ctx.createOscillator();
        volLfo.type = 'sine';
        volLfo.frequency.value = 0.15;
        const volLfoGain = this.ctx.createGain();
        volLfoGain.gain.value = 0.1;
        volLfo.connect(volLfoGain);
        volLfoGain.connect(gain.gain);
        volLfo.start();
        noise.connect(filter);
        filter.connect(gain);
        return { connect: (d) => gain.connect(d), nodes: [noise, filter, gain, lfo, lfoGain, volLfo, volLfoGain] };
    }

    createWaterfall(volume) {
        const noise = this.createPinkNoise();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        noise.connect(filter);
        filter.connect(gain);
        return { connect: (d) => gain.connect(d), nodes: [noise, filter, gain] };
    }

    startBirdLoop(destNode, type) {
        const playBird = () => {
            // Check if this scene is still the active one
            const isActive = (this.currentSoundId === 'birds' || this.currentSoundId === 'wind_birds');
            if (!this.enabled || !this.ctx || !isActive) {
                if (this.scenes['birds']) this.scenes['birds'].loopActive = false;
                if (this.scenes['wind_birds']) this.scenes['wind_birds'].loopActive = false;
                return;
            }
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(destNode);
            const now = this.ctx.currentTime;

            if (type === 'seagull') {
                osc.frequency.setValueAtTime(1500, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.6);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
                gain.gain.linearRampToValueAtTime(0, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.7);
                setTimeout(playBird, 3000 + Math.random() * 4000);
            } else {
                const startFreq = 2000 + Math.random() * 1000;
                osc.frequency.setValueAtTime(startFreq, now);
                osc.frequency.exponentialRampToValueAtTime(startFreq * 2, now + 0.1);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.4);
                setTimeout(playBird, 1000 + Math.random() * 3000);
            }
        };
        playBird();
    }

    startFrogLoop(destNode) {
        console.log('--- AUDIO: Frog loop initiated for Annecy ---');
        const playCroak = () => {
            if (!this.enabled || !this.ctx || this.currentSoundId !== 'frogs') {
                console.log('--- AUDIO: Frog loop terminated (id changed or disabled) ---');
                if (this.scenes['frogs']) this.scenes['frogs'].loopActive = false;
                return;
            }

            console.log('--- AUDIO: Frog Croak! (Procedural) ---');
            const now = this.ctx.currentTime;

            // A "croak" is a low-freq burst with harmonics
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now); // Higher freq for clarity
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.3);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(500, now); // More presence
            filter.Q.value = 15;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.6, now + 0.05); // Louder
            gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destNode);

            osc.start(now);
            osc.stop(now + 0.4);

            // Very frequent for testing
            const delay = Math.random() > 0.5 ? 400 : 1500 + Math.random() * 2000;
            setTimeout(playCroak, delay);
        };
        playCroak();
    }
}
