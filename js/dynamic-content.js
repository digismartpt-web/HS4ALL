/**
 * Hs4all - Dynamic Content Loader
 * Loads data from localStorage (set via admin panel) and applies it to the main site.
 */

// Helper to handle Firebase Arrays which could be converted to Objects
function normalizeArray(data, defaults) {
    if (!data) return defaults;
    if (Array.isArray(data)) return data.length > 0 ? data : defaults;
    const values = Object.values(data);
    return values.length > 0 ? values : defaults;
}

const defaultProjects = [
    { id: 1, title: 'Residência do Lago', img1: 'assets/images/5.jpeg', sound1: 'assets/audio/frogs_lake.mp3', img2: 'assets/images/7.jpeg', sound2: 'assets/audio/music_gentle.mp3' },
    { id: 2, title: 'Chalet Horizonte', img1: 'assets/images/1.jpeg', sound1: 'assets/audio/rain_roof.mp3', img2: 'assets/images/10.jpeg', sound2: 'assets/audio/music_gentle.mp3' },
    { id: 3, title: 'Refúgio dos Pines', img1: 'assets/images/3.jpeg', sound1: 'assets/audio/ocean_waves.mp3', img2: 'assets/images/10.jpeg', sound2: 'assets/audio/nature_forest.mp3' },
    { id: 4, title: 'Retiro da Montanha', img1: 'assets/images/1.jpeg', sound1: 'assets/audio/birds.mp3', img2: 'assets/images/3.jpeg', sound2: 'assets/audio/music_gentle.mp3' }
];

const defaultFixedVisuals = [
    { id: 'hero', name: 'Hero Section', img: 'assets/images/7.jpeg', sound: 'assets/audio/countryside_hero.mp3' },
    { id: 'philosophy', name: 'Filosofia', img: 'assets/images/8.jpeg', sound: 'assets/audio/music_gentle.mp3' },
    { id: 'comfort_ext', name: 'Conforto (Exterior)', img: 'assets/images/1.jpeg', sound: 'assets/audio/rain_roof.mp3' },
    { id: 'comfort_int', name: 'Conforto (Interior)', img: 'assets/images/1.jpeg', sound: 'assets/audio/rain_roof.mp3' },
    { id: 'seaside_ext', name: 'Praia (Exterior)', img: 'assets/images/2.jpeg', sound: 'assets/audio/ocean_waves.mp3' },
    { id: 'seaside_int', name: 'Praia (Interior)', img: 'assets/images/2.jpeg', sound: 'assets/audio/ocean_waves.mp3' },
    { id: 'waterfall_ext', name: 'Cascata (Exterior)', img: 'assets/images/3.jpeg', sound: 'assets/audio/waterfall.mp3' },
    { id: 'waterfall_int', name: 'Cascata (Interior)', img: 'assets/images/3.jpeg', sound: 'assets/audio/waterfall.mp3' },
    { id: 'concept', name: 'Conceito', img: 'assets/images/10.jpeg', sound: 'assets/audio/click_fit.mp3' },
    { id: 'process', name: 'Fabrico', img: 'assets/images/9.jpeg', sound: 'assets/audio/workshop.mp3' }
];

function initDynamicContent() {
    console.log('Initializing Dynamic Content loader...');
    loadFixedVisuals();
    loadProjects();
}

// Poll for StorageDB — StorageDBReady fires before this script registers its listener
if (window.StorageDB) {
    initDynamicContent();
} else {
    let elapsed = 0;
    const interval = setInterval(() => {
        elapsed += 100;
        if (window.StorageDB) {
            clearInterval(interval);
            initDynamicContent();
        } else if (elapsed >= 8000) {
            clearInterval(interval);
            initDynamicContent();
        }
    }, 100);
}

async function loadFixedVisuals() {
    let fixedVisualsData = await window.StorageDB.get('hs4all_fixed_visuals');

    // Normalize data (Firebase might return arrays as objects)
    if (!fixedVisualsData || (Array.isArray(fixedVisualsData) === false && typeof fixedVisualsData !== 'object') || Object.keys(fixedVisualsData).length === 0) {
        try { fixedVisualsData = JSON.parse(localStorage.getItem('hs4all_fixed_visuals')); } catch (e) { fixedVisualsData = null; }
    }

    fixedVisualsData = normalizeArray(fixedVisualsData, defaultFixedVisuals);

    fixedVisualsData.forEach(visual => {
        // Maps the Visual ID from admin.js to specific DOM selectors in index.html.
        // E.g., admin.js has { id: 'hero', name: 'Hero Section', img: '...', sound: '...' }
        try {
            switch (visual.id) {
                case 'hero':
                    updateImgAndSound('.hero-image', visual.img, '.hero .sound-trigger, .hero .image-sound-toggle', visual.sound);
                    break;
                case 'philosophy':
                    updateImgAndSound('#philosophy .split-image img', visual.img, '#philosophy .sound-trigger, #philosophy .image-sound-toggle', visual.sound);
                    break;
                case 'comfort_ext':
                    updateImgAndSound('[data-image-id="Image-Ext-02"]', visual.img, '[data-sound="rain"][data-target-vol="1.0"], .comparison-card [data-sound="rain"][data-target-vol="1.0"] ~ .image-sound-toggle', visual.sound, true);
                    break;
                case 'comfort_int':
                    updateImgAndSound('[data-image-id="Image-Int-02"]', visual.img, '[data-sound="rain"][data-target-vol="0.2"], .comparison-card [data-sound="rain"][data-target-vol="0.2"] ~ .image-sound-toggle', visual.sound, true);
                    updateImgAndSound('[data-image-id="Image-Int-02-Thumb"]', visual.img, null, null);
                    break;
                case 'seaside_ext':
                    updateImgAndSound('[data-image-id="Image-Ext-03"]', visual.img, '[data-sound="ocean"][data-target-vol="1.0"], .comparison-card [data-sound="ocean"][data-target-vol="1.0"] ~ .image-sound-toggle', visual.sound, true);
                    break;
                case 'seaside_int':
                    updateImgAndSound('[data-image-id="Image-Int-03"]', visual.img, '[data-sound="ocean"][data-target-vol="0.2"], .comparison-card [data-sound="ocean"][data-target-vol="0.2"] ~ .image-sound-toggle', visual.sound, true);
                    updateImgAndSound('[data-image-id="Image-Int-03-Thumb"]', visual.img, null, null);
                    break;
                case 'waterfall_ext':
                    updateImgAndSound('[data-image-id="Image-Ext-04"]', visual.img, '[data-sound="waterfall"][data-target-vol="1.0"], .comparison-card [data-sound="waterfall"][data-target-vol="1.0"] ~ .image-sound-toggle', visual.sound, true);
                    break;
                case 'waterfall_int':
                    updateImgAndSound('[data-image-id="Image-Int-05"]', visual.img, '[data-sound="waterfall"][data-target-vol="0.05"], .comparison-card [data-sound="waterfall"][data-target-vol="0.05"] ~ .image-sound-toggle', visual.sound, true);
                    updateImgAndSound('[data-image-id="Image-Int-05-Thumb"]', visual.img, null, null);
                    break;
                case 'concept':
                    updateImgAndSound('.concept-visual img', visual.img, '#concept .sound-trigger, #concept .image-sound-toggle', visual.sound, true);
                    break;
                case 'process':
                    updateImgAndSound('.process-image-full img', visual.img, '#process .sound-trigger, #process .image-sound-toggle', visual.sound, true);
                    break;
            }
        } catch (e) {
            console.error('Error applying fixed visual:', visual.id, e);
        }
    });

    // We must re-init sound manager if we injected base64 audio dynamically 
    // into the data-sound logic, but since simple-sound.js relies on fetching urls 
    // this can be tricky. We need to overwrite simpleSoundManager's cache if we use base64.
    // However, the current setup injects base64 audio if the user uploads a file.
}

function updateImgAndSound(imgSelector, imgSrc, soundSelector, soundSrc, isComparison = false) {
    const imgEls = document.querySelectorAll(imgSelector);
    imgEls.forEach(imgEl => {
        if (imgEl && imgSrc) {
            // Always apply the stored admin src.
            // The HTML may have ?v= cache-busters that prevent path comparison from working,
            // so we do NOT compare — we always overwrite with the stored value.
            imgEl.src = imgSrc;
        }
    });

    if (soundSelector && soundSrc) {
        const soundEls = document.querySelectorAll(soundSelector);
        soundEls.forEach(soundEl => {
            if (soundEl) {
                const soundId = soundEl.getAttribute('data-sound');
                if (soundId && soundSrc) {
                    const isBase64 = soundSrc.startsWith('data:');

                    // Helper to retry injection since managers might initialize AFTER dynamic-content
                    const injectWhenReady = () => {
                        let injected = false;

                        // 1. SIMPLE SOUND MANAGER INJECTION
                        if (window.simpleSoundManager && window.updateSimpleSoundManager) {
                            const prevSrc = window.simpleSoundManager.sounds[soundId]?.src || '';
                            if (!(isComparison && prevSrc.startsWith('data:') && !isBase64)) {
                                window.updateSimpleSoundManager(soundId, soundSrc);
                            }
                            injected = true;
                        }

                        // 2. MAIN SOUND MANAGER INJECTION (SoundSystem.js)
                        if (window.soundManager && window.soundManager.injectCustomAudio) {
                            const currentAudioValid = window.soundManager.sounds[soundId]?.dataset?.valid;
                            if (!(isComparison && currentAudioValid && !isBase64)) {
                                window.soundManager.injectCustomAudio(soundId, soundSrc);
                            }
                            injected = true;
                        }

                        return injected;
                    };

                    if (!injectWhenReady()) {
                        let attempts = 0;
                        const poll = setInterval(() => {
                            attempts++;
                            if (injectWhenReady() || attempts > 100) { // Try for 10 seconds max
                                clearInterval(poll);
                            }
                        }, 100);
                    }
                }
            }
        });
    }
}

function updateSimpleSoundManager(soundId, audioSrc) {
    if (window.simpleSoundManager && window.simpleSoundManager.sounds) {
        if (window.simpleSoundManager.sounds[soundId]) {
            const oldAudio = window.simpleSoundManager.sounds[soundId];
            oldAudio.pause();
            oldAudio.src = audioSrc;
            oldAudio.load(); // Force browser to load the new source
        } else {
            const audio = new Audio(audioSrc);
            audio.preload = 'auto';
            audio.loop = true;
            audio.volume = 0.6;
            window.simpleSoundManager.sounds[soundId] = audio;
        }

        // Mark as initialized so play() doesn't re-create default sounds over our custom ones
        window.simpleSoundManager.initialized = true;
    }
}


async function loadProjects() {
    let projectsData = await window.StorageDB.get('hs4all_projects');

    if (!projectsData || (Array.isArray(projectsData) === false && typeof projectsData !== 'object') || Object.keys(projectsData).length === 0) {
        try { projectsData = JSON.parse(localStorage.getItem('hs4all_projects')); } catch (e) { projectsData = null; }
    }

    projectsData = normalizeArray(projectsData, defaultProjects);

    const projectsGrid = document.querySelector('.projects-grid');
    if (!projectsGrid) return;

    // Clear existing hardcoded projects inside the main grid
    projectsGrid.innerHTML = '';

    // Check if we also have an additional projects modal
    const modalGrid = document.querySelector('.projects-modal-grid');
    if (modalGrid) modalGrid.innerHTML = '';

    projectsData.forEach((project, index) => {
        // We split projects between main grid (first 3) and modal (rest) for the visual design
        const targetGrid = index < 3 ? projectsGrid : (modalGrid || projectsGrid);

        const cardHtml = generateProjectCardHtml(project, index);
        targetGrid.insertAdjacentHTML('beforeend', cardHtml);

        // Register custom sounds if any
        if (project.sound1 && !['music', 'rain', 'ocean', 'waterfall', 'frogs_lake', 'birds', 'countryside_hero'].includes(project.sound1)) {
            updateSimpleSoundManager(`project_${project.id}_sound1`, project.sound1);
        }
        if (project.sound2 && !['music', 'rain', 'ocean', 'waterfall', 'frogs_lake', 'birds', 'countryside_hero'].includes(project.sound2)) {
            // Second sound (e.g. interior) not currently highly utilized in card UI
            // but we bind it just in case
            updateSimpleSoundManager(`project_${project.id}_sound2`, project.sound2);
        }
    });

    // After dynamically adding the HTML, we MUST re-bind the event listeners for these buttons
    if (window.initAllSoundToggles) {
        window.initAllSoundToggles(); // Call function from main.js
    }
    if (window.initImageSoundVisibility) {
        window.initImageSoundVisibility(); // Observe new DOM elements for scroll pausing
    }

    // Apply translations to the newly injected DOM elements
    if (typeof setLanguage === 'function') {
        const storedLang = localStorage.getItem('hs4all_lang') || 'pt';
        setLanguage(storedLang);
    }

    // Rebind fullscreen view toggles for newly generated projects
    if (typeof window.initFullscreenView === 'function') {
        const modal = document.getElementById('projectsModal');
        if (modal) {
            window.initFullscreenView(modal);
        }
    }
}

function getSoundIdFromPath(path) {
    if (!path) return '';
    if (path.includes('frogs_lake')) return 'frogs_lake';
    if (path.includes('music_gentle')) return 'music';
    if (path.includes('rain_roof')) return 'rain';
    if (path.includes('ocean_waves')) return 'ocean';
    if (path.includes('waterfall')) return 'waterfall';
    if (path.includes('birds')) return 'birds';
    if (path.includes('nature_forest')) return 'birds'; // fallback
    return '';
}

function generateProjectCardHtml(project, index) {
    const isLarge = index === 0 ? 'project-card--large' : '';

    let soundId = '';
    if (project.sound1) {
        // If it's a known short ID from the old defaults
        if (['music', 'rain', 'ocean', 'waterfall', 'frogs_lake', 'birds', 'countryside_hero'].includes(project.sound1)) {
            soundId = project.sound1;
        } else {
            // For base64, external URL, or local asset path assigned via Admin
            soundId = `project_${project.id}_sound1`;
        }
    }

    const soundHtml = soundId ? `
                            <!-- Sound Toggle Button -->
                            <button class="image-sound-toggle" aria-label="Contrôler le son de cette image"
                                title="Contrôler le son de cette image" data-sound="${soundId}">
                                <svg class="sound-icon sound-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                                <svg class="sound-icon sound-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            </button>
    ` : '';

    return `
        <div class="project-card ${isLarge} reveal sound-trigger" data-sound="${soundId}" data-target-vol="1.0">
            <div class="project-preview">
                <!-- Exterior Image -->
                <img src="${project.img1}" alt="${project.title}" class="project-img-ext" loading="lazy">

                <!-- Interior Image -->
                <img src="${project.img2}" alt="Intérieur ${project.title}" class="project-img-int" loading="lazy">

                <!-- Interior Thumbnail -->
                <img src="${project.img2}" alt="Aperçu intérieur" class="project-int-thumb">

                <!-- Expand Button - Arrow only -->
                <button class="project-expand-arrow" aria-label="Agrandir">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                </button>

                <!-- Reveal Toggle Button -->
                <button class="reveal-toggle" aria-label="Entrer dans l'immersion"
                    title="Entrer dans l'immersion">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span data-i18n="projects.reveal">Entrer dans l'immersion</span>
                </button>

${soundHtml}
            </div>
        </div>`;
}
