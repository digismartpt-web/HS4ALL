/**
 * Hs4all - Premium Modular House Website
 * Main JavaScript - Interactions, Scroll Effects, Sound System, Localization
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Version 69');
    try {
        // Initialize all modules
        initLocalization();
        initSmoothScroll();
        initNavigation();
        initScrollReveal();
        initParallax();
        initSoundSystem();
        initRainEffect();
        initHeroAnimation();
        initFormHandler();
        initVoiceOver();
        initComparisonCards();
        initProjectCloseButtons();
        initProjectsModal();
        initAllSoundToggles();
        console.log('All modules initialized successfully');
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

/**
 * Localization System (i18n)
 */
function initLocalization() {
    console.log('Initializing localization...');

    const langDropdown = document.querySelector('.lang-dropdown');
    if (!langDropdown) {
        console.error('Language dropdown container not found');
        return;
    }

    const langCurrent = langDropdown.querySelector('.lang-current');
    const langOptions = langDropdown.querySelectorAll('.lang-options [data-lang]');
    const storedLang = localStorage.getItem('hs4all_lang') || 'pt';

    if (!langCurrent) {
        console.error('Language current button not found');
        return;
    }

    // Set up language switching IMMEDIATELY — no Firebase wait
    setLanguage(storedLang);

    // Toggle dropdown — use a flag to prevent document listener from closing on same tick
    let justOpened = false;
    langCurrent.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const wasOpen = langDropdown.classList.contains('open');
        langDropdown.classList.toggle('open');
        justOpened = !wasOpen;
        if (justOpened) {
            // Reset flag after current event loop so document listener works for FUTURE clicks
            setTimeout(() => { justOpened = false; }, 50);
        }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (justOpened) return; // ignore the same click that opened
        if (langDropdown.classList.contains('open') && !langDropdown.contains(e.target)) {
            langDropdown.classList.remove('open');
        }
    });

    // Language option clicks
    langOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
            langDropdown.classList.remove('open');
        });
    });


    // Strip HTML/SVG tags from a string, keeping only text content
    function stripHtmlTags(str) {
        if (!str || typeof str !== 'string') return str;
        // Use a temporary element to extract text safely
        const tmp = document.createElement('div');
        tmp.innerHTML = str;
        return tmp.textContent || tmp.innerText || str;
    }

    // NOW try to load custom texts from Firebase asynchronously
    // If Firebase fails, the dropdown is already working with default translations
    const tryLoadCustomTexts = async () => {
        try {
            if (!window.StorageDB) return;
            const customTexts = await window.StorageDB.get('hs4all_texts');
            if (customTexts && window.translations) {
                // Merge custom texts into window.translations for ALL known languages
                const allLangs = Object.keys(window.translations);
                allLangs.forEach(lang => {
                    if (customTexts[lang] && window.translations[lang]) {
                        Object.keys(customTexts[lang]).forEach(key => {
                            // Only overwrite if the custom value is non-empty
                            let val = customTexts[lang][key];
                            if (val !== null && val !== undefined && val !== '') {
                                // If the value contains SVG tags (corrupted API response like <g id="1">...),
                                // fall back to the static default — don't apply corrupted value.
                                // We only block SVG tags, not <br> which is legitimate in titles.
                                const hasSvgTags = /<(g|path|svg|defs|use|circle|rect|polygon|ellipse)\b/i.test(val);
                                if (hasSvgTags) return;
                                if (val) window.translations[lang][key] = val;
                            }
                        });
                    }
                });
                // Re-apply translations to show any custom text overrides
                setLanguage(localStorage.getItem('hs4all_lang') || 'pt');
            }
        } catch (e) {
            console.warn('Could not load custom texts from Firebase:', e);
        }
    };

    // Try immediately if StorageDB ready, otherwise poll
    if (window.StorageDB) {
        tryLoadCustomTexts();
    } else {
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 100;
            if (window.StorageDB) {
                clearInterval(interval);
                tryLoadCustomTexts();
            } else if (elapsed >= 8000) {
                clearInterval(interval);
            }
        }, 100);
    }
}

function setLanguage(lang) {
    if (!window.translations || !window.translations[lang]) return;

    // Update current display
    const currentName = document.querySelector('.lang-current .lang-name');
    const langNames = {
        'pt': 'Português',
        'fr': 'Français',
        'en': 'English',
        'es': 'Español'
    };

    if (currentName) currentName.textContent = langNames[lang];

    // Update active state in list
    document.querySelectorAll('.lang-options button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update text content
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.translations[lang][key]) {
            // Handle HTML content if needed (for specific tags)
            if (el.tagName === 'H1' || el.tagName === 'H2' || el.classList.contains('section-title')) {
                el.innerHTML = window.translations[lang][key];
            } else {
                el.textContent = window.translations[lang][key];
            }
        }
    });

    // Update html lang attribute
    document.documentElement.lang = lang;
    localStorage.setItem('hs4all_lang', lang);
}

/**
 * Smooth Scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                document.querySelector('.nav-menu').classList.remove('open');
            }
        });
    });
}

/**
 * Navigation - Scroll state & Mobile toggle
 */
function initNavigation() {
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');

    // Scroll effect
    let lastScroll = 0;
    const scrollThreshold = 50;

    const handleScroll = throttle(() => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > scrollThreshold) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }, 16);

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Mobile toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });
    }

    // Close menu on click outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && navMenu.classList.contains('open')) {
            navMenu.classList.remove('open');
            navToggle.classList.remove('open');
        }
    });
}

/**
 * Scroll Reveal Animation
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Initialize image sound cutoff at 50% visibility
    initImageSoundVisibility();
}

function initImageSoundVisibility() {
    if (!window.globalSoundObserver) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0
        };

        window.globalSoundObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If the container is completely out of view, stop its active sounds
                if (!entry.isIntersecting) {
                    const activeBtns = entry.target.querySelectorAll('.image-sound-toggle.active');

                    activeBtns.forEach(btn => {
                        const soundId = btn.getAttribute('data-sound');
                        if (soundId && window.simpleSoundManager) {
                            window.simpleSoundManager.stop(soundId);
                        }
                        btn.classList.remove('active');
                    });
                }
            });
        }, observerOptions);
    }

    // Observe layout containers instead of tiny buttons, so the sound lasts while the image is still visible
    const containers = document.querySelectorAll('.hero, .split-image, .comparison-card, .concept-visual, .process-image-full, .project-card');

    containers.forEach(el => {
        if (!el.dataset.soundContainerObserved) {
            el.dataset.soundContainerObserved = 'true';
            window.globalSoundObserver.observe(el);
        }
    });
}

/**
 * Subtle Parallax Effect for Hero
 */
function initParallax() {
    const hero = document.querySelector('.hero');
    const heroImage = document.querySelector('.hero-image');

    if (!hero || !heroImage) return;

    const handleParallax = throttle(() => {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;

        // Only apply parallax when hero is in view
        if (scrolled < heroHeight) {
            const parallaxValue = scrolled * 0.3;
            heroImage.style.transform = `scale(1.1) translateY(${parallaxValue}px)`;
        }
    }, 16);

    window.addEventListener('scroll', handleParallax, { passive: true });
}

/**
 * Sound System - Image Specific Audio
 */
function initSoundSystem() {
    // Guard: SoundSystem.js might not be loaded (network failure, private browsing restriction, etc.)
    if (typeof SoundManager === 'undefined') {
        console.warn('SoundManager not available — scroll-based sound system disabled. Other features still work.');
        return;
    }
    const soundManager = new SoundManager();
    window.soundManager = soundManager; // Expose globally for dynamic-content.js injection
    soundManager.init(); // Preload sounds

    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            const isEnabled = soundManager.toggle();
            soundToggle.classList.toggle('active', isEnabled);

            // Trigger initial check if enabled
            if (isEnabled) handleScrollSounds();
        });
    }

    // Pause on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && soundManager.enabled) {
            soundManager.stopAll();
        }
    });

    // Scroll Detection for Audio
    const handleScrollSounds = throttle(() => {
        if (!soundManager.enabled || soundManager.hoverLocked) {
            console.log('Scroll sounds skipped (disabled or hover locked)');
            return;
        }

        const triggers = document.querySelectorAll('.sound-trigger');
        const center = window.scrollY + (window.innerHeight / 2); // Center of viewport

        let activeSound = null;

        // Check which trigger is currently "focused"
        triggers.forEach(trigger => {
            const rect = trigger.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            const absoluteBottom = rect.bottom + window.scrollY;

            if (center >= absoluteTop && center <= absoluteBottom) {
                activeSound = trigger.getAttribute('data-sound');
            }
        });

        if (activeSound) {
            soundManager.play(activeSound);
        } else {
            soundManager.stopAll();
        }
    }, 150);

    // Hover Interaction for Project Cards (Use event delegation for dynamic cards)
    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.projects-grid .project-card, .projects-modal-grid .project-card');
        if (!card) return;

        const trigger = card.querySelector('.sound-trigger');
        if (!trigger || !soundManager.enabled) return;

        // Ensure we only trigger once per card entry
        if (!card.dataset.hovered) {
            card.dataset.hovered = 'true';
            const sound = trigger.getAttribute('data-sound');
            if (sound) {
                console.log(`Hover detected on card for sound: ${sound}`);
                soundManager.hoverLocked = true;
                soundManager.play(sound);
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.projects-grid .project-card, .projects-modal-grid .project-card');
        if (!card) return;

        // Check if mouse actually left the card (not just moved to a child element)
        if (!card.contains(e.relatedTarget)) {
            card.dataset.hovered = '';
            if (!soundManager.enabled) return;
            console.log('Mouse left project card, returning to scroll mode');
            soundManager.hoverLocked = false;
            handleScrollSounds();
        }
    });

    // Click Interaction (Mobile support + Sound) & Click Outside to close
    document.addEventListener('click', (e) => {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const clickedCard = e.target.closest('.projects-grid .project-card, .projects-modal-grid .project-card');

        // Close all cards if clicked outside
        if (!clickedCard) {
            const currentCards = document.querySelectorAll('.project-card.active');
            if (currentCards.length > 0) {
                currentCards.forEach(c => c.classList.remove('active'));
                if (soundManager.enabled) {
                    soundManager.hoverLocked = false;
                    handleScrollSounds();
                }
            }
            return;
        }

        // Mobile touch logic
        if (isTouch) {
            const trigger = clickedCard.querySelector('.sound-trigger');

            // Note: The actual opening/adding .active is handled by the other global click listener
            // (the one at line 751 for reveal-toggle and project-img-ext).
            // We only need to sync the sound for mobile here.

            setTimeout(() => { // wait for the other click handler to toggle .active
                const isActive = clickedCard.classList.contains('active');
                if (soundManager.enabled && trigger) {
                    if (isActive) {
                        const sound = trigger.getAttribute('data-sound');
                        if (sound) {
                            console.log(`Touch click detected: Playing ${sound}`);
                            soundManager.hoverLocked = true;
                            soundManager.play(sound);
                        }
                    } else {
                        console.log('Touch click detected: Closing card, stopping sound');
                        soundManager.hoverLocked = false;
                        handleScrollSounds();
                    }
                }
            }, 50);
        }
    });

    window.addEventListener('scroll', handleScrollSounds, { passive: true });
}

/**
 * Visual Rain Effect using Canvas
 */
function initRainEffect() {
    const container = document.getElementById('rainContainer');
    if (!container) return;

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Set canvas size
    const resizeCanvas = () => {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ctx = canvas.getContext('2d');
    const drops = [];
    const count = 100;

    class Drop {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -100;
            this.speed = 10 + Math.random() * 10;
            this.len = 10 + Math.random() * 20;
            this.alpha = 0.1 + Math.random() * 0.2;
        }
        update() {
            this.y += this.speed;
            if (this.y > canvas.height) this.reset();
        }
        draw() {
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.len);
            ctx.stroke();
        }
    }

    for (let i = 0; i < count; i++) drops.push(new Drop());

    function animate() {
        // Only animate if section is roughly in view to save resources
        const rect = container.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drops.forEach(drop => {
                drop.update();
                drop.draw();
            });
        }
        requestAnimationFrame(animate);
    }
    animate();
}

/**
 * Hero Animation on Load
 */
function initHeroAnimation() {
    const hero = document.querySelector('.hero');
    const heroImage = document.querySelector('.hero-image');

    if (!hero || !heroImage) return;

    const activateHero = () => {
        setTimeout(() => {
            hero.classList.add('loaded');
            // Reveal hero content with stagger
            const heroReveals = hero.querySelectorAll('.reveal');
            heroReveals.forEach((el, i) => {
                setTimeout(() => {
                    el.classList.add('revealed');
                }, 200 + (i * 150));
            });
        }, 100);
    };

    if (heroImage.complete) {
        activateHero();
    } else {
        heroImage.addEventListener('load', activateHero);
    }
}

/**
 * Contact Form Handler
 */
function initFormHandler() {
    const form = document.getElementById('contactForm');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Simulate form submission
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        const sendingText = document.documentElement.lang === 'en' ? 'Sending...' : 'Envoi en cours...';
        const sentText = document.documentElement.lang === 'en' ? 'Sent!' : 'Envoyé !';

        button.textContent = sendingText;
        button.disabled = true;

        setTimeout(() => {
            button.textContent = sentText;
            button.style.backgroundColor = '#6B8E23';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
                button.disabled = false;
                form.reset();
            }, 3000);
        }, 1500);

        console.log('Form submitted:', data);
    });
}


/**
 * Utility: Throttle
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Voice Over - Text to Speech
 */
function initVoiceOver() {
    const triggers = document.querySelectorAll('.voice-trigger');
    if (!triggers.length) return;

    let currentSection = null;

    const langCodeMap = {
        'pt': 'pt-PT',
        'fr': 'fr-FR',
        'en': 'en-US',
        'es': 'es-ES'
    };

    triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();

            // Arrêter tous les autres sons quand on clique sur "Ouvir a secção"
            if (window.simpleSoundManager) {
                window.simpleSoundManager.stopAll();
            }
            document.querySelectorAll('.image-sound-toggle.active').forEach(t => t.classList.remove('active'));

            const voiceSection = trigger.getAttribute('data-voice-section');
            if (!voiceSection) return;

            const lang = document.documentElement.lang || 'fr';
            const utterLang = langCodeMap[lang] || 'fr-FR';

            if (currentSection === voiceSection) {
                if (window.speechSynthesis.speaking) {
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    } else {
                        window.speechSynthesis.pause();
                    }
                    return;
                }
            }

            window.speechSynthesis.cancel();
            currentSection = voiceSection;

            const section = document.getElementById(voiceSection);
            if (!section) return;

            const elements = section.querySelectorAll('[data-i18n], h1, h2, h3, p');
            const textsToRead = [];
            const processedTexts = new Set();

            elements.forEach(el => {
                if (el.closest('button') && !el.closest('.voice-trigger')) return;
                if (el.querySelector('[data-i18n]')) return;
                const raw = el.textContent || '';
                const cleaned = raw.replace(/\s+/g, ' ').trim();
                if (cleaned && cleaned.length > 2 && !processedTexts.has(cleaned)) {
                    processedTexts.add(cleaned);
                    textsToRead.push(cleaned);
                }
            });

            if (!textsToRead.length) return;

            const fullText = textsToRead.join('. ');
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.lang = utterLang;
            utterance.rate = 0.95;

            utterance.onend = () => { currentSection = null; };
            window.speechSynthesis.speak(utterance);
        });
    });
}

/**
 * Comparison Cards Interaction
 */
function initComparisonCards() {
    const comparisonCards = document.querySelectorAll('.comparison-card');
    if (!comparisonCards.length) return;

    comparisonCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.image-sound-toggle')) return;
            card.classList.toggle('active');
        });
    });
}

/**
 * Initialize ALL sound toggles on the site
 */
function initAllSoundToggles() {
    const allToggles = document.querySelectorAll('.image-sound-toggle');

    allToggles.forEach(toggle => {
        if (toggle.dataset.bound) return;
        toggle.dataset.bound = 'true';

        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const soundId = this.getAttribute('data-sound');
            const targetVol = parseFloat(this.getAttribute('data-target-vol')) || 1.0;

            if (this.classList.contains('active')) {
                this.classList.remove('active');
                window.simpleSoundManager?.pause(soundId);
            } else {
                // Stop all other sounds
                allToggles.forEach(t => {
                    if (t !== this) {
                        t.classList.remove('active');
                        const otherSoundId = t.getAttribute('data-sound');
                        if (otherSoundId) {
                            window.simpleSoundManager?.stop(otherSoundId);
                        }
                    }
                });

                this.classList.add('active');
                window.simpleSoundManager?.play(soundId, targetVol);
            }
        });
    });

    // Event delegation for reveal toggle and thumbnail on ALL project cards
    // This approach works for all cards (main grid, modal grid) regardless of when they are added
    if (!document.body.dataset.revealDelegated) {
        document.body.dataset.revealDelegated = 'true';

        document.body.addEventListener('click', (e) => {
            // Handle reveal toggle button — always OPENS the card (one-way reveal)
            const revealBtn = e.target.closest('.project-card .reveal-toggle');
            if (revealBtn) {
                e.stopPropagation();
                const card = revealBtn.closest('.project-card');
                if (!card) return;
                const soundToggle = card.querySelector('.image-sound-toggle');
                if (window.simpleSoundManager) window.simpleSoundManager.stopAll();
                if (soundToggle) soundToggle.classList.remove('active');
                card.classList.add('active'); // always open, never close with this button
                return;
            }

            // Handle interior thumbnail click — toggles back to exterior
            const thumb = e.target.closest('.project-card .project-int-thumb');
            if (thumb) {
                e.stopPropagation();
                const card = thumb.closest('.project-card');
                if (!card) return;
                const soundToggle = card.querySelector('.image-sound-toggle');
                if (window.simpleSoundManager) window.simpleSoundManager.stopAll();
                if (soundToggle) soundToggle.classList.remove('active');
                card.classList.toggle('active');
                return;
            }

            // Handle exterior image click — opens the card to interior view
            const extImg = e.target.closest('.project-card .project-img-ext');
            if (extImg) {
                e.stopPropagation();
                const card = extImg.closest('.project-card');
                if (!card) return;
                const soundToggle = card.querySelector('.image-sound-toggle');
                if (window.simpleSoundManager) window.simpleSoundManager.stopAll();
                if (soundToggle) soundToggle.classList.remove('active');
                card.classList.add('active'); // click on exterior photo → enter immersion
            }
        }, true); // capture phase so it fires before any stopPropagation
    }
}

/**
 * Project Close Buttons
 */
function initProjectCloseButtons() {
    const closeButtons = document.querySelectorAll('.project-fullscreen-close, .project-fullscreen-overlay');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const fullscreen = document.getElementById('projectFullscreen');
            if (fullscreen) {
                fullscreen.classList.remove('open');
                fullscreen.classList.remove('revealed');

                // Stop ALL sounds when closing the fullscreen view
                if (window.simpleSoundManager) {
                    window.simpleSoundManager.stopAll();
                }

                // Remove active state from all sound toggles
                fullscreen.querySelectorAll('.image-sound-toggle.active').forEach(btn => {
                    btn.classList.remove('active');
                });
            }
        });
    });

    // Use event delegation on the fullscreen container for robust click handling
    const fullscreen = document.getElementById('projectFullscreen');
    if (fullscreen && !fullscreen.dataset.delegated) {
        fullscreen.dataset.delegated = 'true';
        fullscreen.addEventListener('click', (e) => {
            if (!fullscreen.classList.contains('open')) return;

            const revealBtn = e.target.closest('#fullscreenRevealBtn');
            const thumb = e.target.closest('#fullscreenThumb');
            const soundBtn = e.target.closest('#fullscreenSoundBtn');
            const closeBtn = e.target.closest('.project-fullscreen-close');
            const content = e.target.closest('.project-fullscreen-content');

            if (revealBtn || thumb) {
                e.stopPropagation();
                // Stop all sounds when revealing interior
                if (window.simpleSoundManager) {
                    window.simpleSoundManager.stopAll();
                }
                const soundBtnEl = document.getElementById('fullscreenSoundBtn');
                if (soundBtnEl) soundBtnEl.classList.remove('active');
                // Toggle the revealed state (CSS handles the animation)
                fullscreen.classList.toggle('revealed');
            } else if (!soundBtn && !closeBtn && !content) {
                // Clicked on the dark background (outside content) — close and stop sounds
                fullscreen.classList.remove('open');
                fullscreen.classList.remove('revealed');
                if (window.simpleSoundManager) {
                    window.simpleSoundManager.stopAll();
                }
                fullscreen.querySelectorAll('.image-sound-toggle.active').forEach(b => b.classList.remove('active'));
            }
        });
    }
}

/**
 * Projects Modal Functionality
 */
function initProjectsModal() {
    const modal = document.getElementById('projectsModal');
    const openBtn = document.getElementById('viewAllProjectsBtn');
    const closeBtn = modal?.querySelector('.projects-modal-close');
    const overlay = modal?.querySelector('.projects-modal-overlay');

    if (!modal || !openBtn) return;

    // Open modal
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const modalReveals = modal.querySelectorAll('.reveal');
        modalReveals.forEach(el => el.classList.add('revealed'));
    });

    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        const activeSounds = modal.querySelectorAll('.image-sound-toggle.active');
        activeSounds.forEach(toggle => {
            const soundId = toggle.getAttribute('data-sound');
            window.simpleSoundManager?.stop(soundId);
            toggle.classList.remove('active');
        });
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // Project cards click (using event delegation for dynamically added cards)
    modal.addEventListener('click', (e) => {
        const card = e.target.closest('.project-card');
        if (!card) return;

        const isClickingToggle = e.target.closest('.reveal-toggle');
        const isClickingSound = e.target.closest('.image-sound-toggle');
        const isClickingArrow = e.target.closest('.project-expand-arrow');

        if (isClickingSound || isClickingArrow) return;

        if (isClickingToggle) {
            // "Continuer immersion" : ouvre seulement, ne ferme jamais
            card.classList.add('active');
            return;
        }

        if (card.classList.contains('active')) {
            card.classList.remove('active');
        } else {
            card.classList.add('active');
        }
    });

    // Initialize fullscreen
    initFullscreenView(modal);
}

/**
 * Fullscreen View
 */
function initFullscreenView(modal) {
    const fullscreen = document.getElementById('projectFullscreen');
    if (!fullscreen) {
        console.log('Fullscreen element not found');
        return;
    }

    console.log('Initializing fullscreen view');
    let currentSoundId = null;

    // Expand arrows - attach to all expand arrows on the page, not just the modal
    const expandArrows = document.querySelectorAll('.project-expand-arrow');
    expandArrows.forEach(arrow => {
        if (arrow.dataset.boundFullscreen) return;
        arrow.dataset.boundFullscreen = 'true';

        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = arrow.closest('.project-card');
            if (!card) return;

            // Stop all sounds when opening fullscreen
            if (window.simpleSoundManager) {
                window.simpleSoundManager.stopAll();
            }

            const extImg = card.querySelector('.project-img-ext');
            const intImg = card.querySelector('.project-img-int');
            const thumbImg = card.querySelector('.project-int-thumb');

            const fullscreenExtImg = document.getElementById('fullscreenExtImg');
            const fullscreenIntImg = document.getElementById('fullscreenIntImg');
            const fullscreenThumb = document.getElementById('fullscreenThumb');

            if (fullscreenExtImg && extImg) fullscreenExtImg.src = extImg.src;
            if (fullscreenIntImg) {
                if (intImg && intImg.src) {
                    fullscreenIntImg.src = intImg.src;
                } else {
                    fullscreenIntImg.src = 'assets/images/1.jpeg';
                }
            }
            if (fullscreenThumb) {
                if (thumbImg && thumbImg.src) {
                    fullscreenThumb.src = thumbImg.src;
                } else if (intImg && intImg.src) {
                    fullscreenThumb.src = intImg.src;
                } else if (extImg && extImg.src) {
                    fullscreenThumb.src = extImg.src;
                } else {
                    fullscreenThumb.src = 'assets/images/1.jpeg';
                }
            }

            currentSoundId = card.getAttribute('data-sound');
            const fullscreenSoundBtn = document.getElementById('fullscreenSoundBtn');
            if (fullscreenSoundBtn) {
                fullscreenSoundBtn.setAttribute('data-sound', currentSoundId || '');
                fullscreenSoundBtn.classList.remove('active');

                // Allow the button to be rebound or triggered correctly with new sound
                delete fullscreenSoundBtn.dataset.bound;
            }

            // Apply translation immediately when opened so the reveal button says the right thing
            if (typeof setLanguage === 'function') {
                const storedLang = localStorage.getItem('hs4all_lang') || 'pt';
                setLanguage(storedLang);
            }

            // Reinitialize sound toggles so the fullscreen button picks up its new data-sound
            if (typeof window.initAllSoundToggles === 'function') {
                window.initAllSoundToggles();
            }

            fullscreen.classList.remove('revealed');
            fullscreen.classList.add('open');

            // Force the reveal button to be visible immediately
            const revealBtn = document.getElementById('fullscreenRevealBtn');
            if (revealBtn) {
                revealBtn.style.opacity = '1';
                revealBtn.style.visibility = 'visible';
                revealBtn.style.display = 'flex';
                revealBtn.style.pointerEvents = 'auto';
                revealBtn.style.transform = 'none';
            }
        });
    });
}

