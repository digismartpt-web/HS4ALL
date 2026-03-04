// ============================================
// Admin Dashboard JavaScript
// ============================================

const ADMIN_PASSWORD = 'hs4all2024';

let projectsData = [];
let fixedVisualsData = [];
let textsData = {};
let socialSettingsData = {
    facebook: '',
    facebookVisible: true,
    instagram: '',
    instagramVisible: true,
    linkedin: '',
    linkedinVisible: true,
    pinterest: '',
    pinterestVisible: true
};

// ============================================
// Default Data (same as dynamic-content.js)
// ============================================

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

// ============================================
// Helper: normalize Firebase data (object or array -> array)
// ============================================
function normalizeArray(data, defaults) {
    if (!data) return defaults;
    if (Array.isArray(data)) return data.length > 0 ? data : defaults;
    // Firebase stores arrays as objects {0: {...}, 1: {...}}
    const values = Object.values(data);
    return values.length > 0 ? values : defaults;
}

// ============================================
// Data Initialization
// ============================================
async function initAdminData() {
    console.log('[Admin] Initializing data...');
    try {
        // StorageDB already prioritizes Firebase if available. 
        // We call get() which will check Firebase version and fetch if needed.
        const rawProjects = await window.StorageDB.get('hs4all_projects');
        projectsData = normalizeArray(rawProjects, defaultProjects);

        const rawVisuals = await window.StorageDB.get('hs4all_fixed_visuals');
        fixedVisualsData = normalizeArray(rawVisuals, defaultFixedVisuals);

        const rawTexts = await window.StorageDB.get('hs4all_texts');
        textsData = (rawTexts && typeof rawTexts === 'object') ? rawTexts : {};

        const rawSocial = await window.StorageDB.get('hs4all_social_settings');
        if (rawSocial) socialSettingsData = { ...socialSettingsData, ...rawSocial };

    } catch (e) {
        console.error('Admin data load failed:', e);
        projectsData = defaultProjects;
        fixedVisualsData = defaultFixedVisuals;
        textsData = {};
    }

    // Render now that data is ready
    if (window.adminIsLoggedIn) {
        renderAll();
    }
    console.log('[Admin] Data initialized from StorageDB');
}

function renderAll() {
    renderFixedVisuals();
    renderProjects();
    renderTexts();
    renderSocialSettings();
}

// ============================================
// Fixed Visuals UI
// ============================================
function renderFixedVisuals() {
    const container = document.getElementById('fixedVisualsList');
    if (!container) return;
    container.innerHTML = '';

    fixedVisualsData.forEach((visual) => {
        const block = document.createElement('div');
        block.className = 'fixed-visual-block pretty-block';
        block.innerHTML = `
            <div class="fixed-visual-header"><span class="fixed-visual-title">${visual.name}</span></div>
            <div class="fixed-visual-content-row">
                <div class="fixed-visual-img-wrap">
                    <img src="${visual.img}" alt="${visual.name}" class="fixed-visual-img" />
                    <input type="file" accept="image/*" id="imgInput_${visual.id}" style="display:none;">
                    <button class="replace-img-btn" data-id="${visual.id}">Remplacer l'image</button>
                </div>
                <div class="fixed-visual-audio-wrap">
                    <audio controls src="${visual.sound}"></audio>
                    <input type="file" accept="audio/*" id="audioInput_${visual.id}" style="display:none;">
                    <button class="replace-audio-btn" data-id="${visual.id}">Remplacer le son</button>
                </div>
            </div>
        `;
        container.appendChild(block);

        block.querySelector('.replace-img-btn').onclick = () => block.querySelector(`#imgInput_${visual.id}`).click();
        block.querySelector(`#imgInput_${visual.id}`).onchange = (e) => handleFixedVisualImgChange(visual.id, e);
        block.querySelector('.replace-audio-btn').onclick = () => block.querySelector(`#audioInput_${visual.id}`).click();
        block.querySelector(`#audioInput_${visual.id}`).onchange = (e) => handleFixedVisualAudioChange(visual.id, e);
    });
}

function handleFixedVisualImgChange(id, event) {
    const file = event.target.files[0];
    if (!file) return;

    // Use a button for loading feedback if possible, or just log
    console.log(`Uploading image for ${id}...`);

    const path = `visuals/${id}_${Date.now()}_${file.name}`;
    window.StorageDB.uploadFile(path, file).then(async (url) => {
        const idx = fixedVisualsData.findIndex(v => v.id === id);
        if (idx !== -1) {
            fixedVisualsData[idx].img = url;
            await window.StorageDB.set('hs4all_fixed_visuals', fixedVisualsData);
            renderFixedVisuals();
        }
    }).catch(err => {
        alert("Erreur lors de l'upload de l'image");
        console.error(err);
    });
}

function handleFixedVisualAudioChange(id, event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`Uploading audio for ${id}...`);
    const path = `audio/${id}_${Date.now()}_${file.name}`;

    window.StorageDB.uploadFile(path, file).then(async (url) => {
        const idx = fixedVisualsData.findIndex(v => v.id === id);
        if (idx !== -1) {
            fixedVisualsData[idx].sound = url;

            // Update audio element directly without full render
            const audioEl = event.target.closest('.fixed-visual-audio-wrap')?.querySelector('audio');
            if (audioEl) {
                audioEl.src = url;
                audioEl.load();
            }

            await window.StorageDB.set('hs4all_fixed_visuals', fixedVisualsData);
            console.log(`Updated sound for ${id} in Storage and DB.`);
        }
    }).catch(err => {
        alert("Erreur lors de l'upload du son");
        console.error(err);
    });
}

// ============================================
// Projects UI
// ============================================
function renderProjects() {
    const container = document.getElementById('projectsList');
    if (!container) return;
    container.innerHTML = '';

    projectsData.forEach((project) => {
        const block = document.createElement('div');
        block.className = 'project-block pretty-block';
        block.innerHTML = `
            <div class="project-header"><span class="project-title">${project.title || 'Projeto #' + project.id}</span></div>
            <div class="project-content-row">
                <div class="project-img-audio">
                    <img src="${project.img1}" alt="Imagem Exterior" class="project-img" />
                    <input type="file" accept="image/*" id="img1Input_${project.id}" style="display:none;">
                    <button class="replace-img1-btn">Remplacer l'image 1</button>
                    <audio controls src="${project.sound1}"></audio>
                    <input type="file" accept="audio/*" id="sound1Input_${project.id}" style="display:none;">
                    <button class="replace-sound1-btn">Remplacer le son 1</button>
                </div>
                <div class="project-img-audio">
                    <img src="${project.img2}" alt="Imagem Interior" class="project-img" />
                    <input type="file" accept="image/*" id="img2Input_${project.id}" style="display:none;">
                    <button class="replace-img2-btn">Remplacer l'image 2</button>
                    <audio controls src="${project.sound2}"></audio>
                    <input type="file" accept="audio/*" id="sound2Input_${project.id}" style="display:none;">
                    <button class="replace-sound2-btn">Remplacer le son 2</button>
                </div>
            </div>
            <div class="project-actions">
                <button class="delete-project-btn">Supprimer le projet</button>
            </div>
        `;
        container.appendChild(block);

        block.querySelector('.replace-img1-btn').onclick = () => block.querySelector(`#img1Input_${project.id}`).click();
        block.querySelector(`#img1Input_${project.id}`).onchange = (e) => handleProjectImgChange(project.id, 1, e);
        block.querySelector('.replace-sound1-btn').onclick = () => block.querySelector(`#sound1Input_${project.id}`).click();
        block.querySelector(`#sound1Input_${project.id}`).onchange = (e) => handleProjectSoundChange(project.id, 1, e);
        block.querySelector('.replace-img2-btn').onclick = () => block.querySelector(`#img2Input_${project.id}`).click();
        block.querySelector(`#img2Input_${project.id}`).onchange = (e) => handleProjectImgChange(project.id, 2, e);
        block.querySelector('.replace-sound2-btn').onclick = () => block.querySelector(`#sound2Input_${project.id}`).click();
        block.querySelector(`#sound2Input_${project.id}`).onchange = (e) => handleProjectSoundChange(project.id, 2, e);
        block.querySelector('.delete-project-btn').onclick = () => deleteProject(project.id);
    });
}

function handleProjectImgChange(id, imgNum, event) {
    const file = event.target.files[0];
    if (!file) return;

    const path = `projects/p${id}_img${imgNum}_${Date.now()}_${file.name}`;
    window.StorageDB.uploadFile(path, file).then(async (url) => {
        const idx = projectsData.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            projectsData[idx][`img${imgNum}`] = url;
            await window.StorageDB.set('hs4all_projects', projectsData);
            renderProjects();
        }
    }).catch(err => {
        alert("Erreur lors de l'upload de l'image");
        console.error(err);
    });
}

function handleProjectSoundChange(id, soundNum, event) {
    const file = event.target.files[0];
    if (!file) return;

    const path = `projects/p${id}_sound${soundNum}_${Date.now()}_${file.name}`;
    window.StorageDB.uploadFile(path, file).then(async (url) => {
        const idx = projectsData.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            projectsData[idx][`sound${soundNum}`] = url;

            // Update audio element directly
            const audioEl = event.target.closest('.project-img-audio')?.querySelector('audio');
            if (audioEl) {
                audioEl.src = url;
                audioEl.load();
            }

            await window.StorageDB.set('hs4all_projects', projectsData);
            console.log(`Updated project ${id} sound${soundNum} in Storage and DB.`);
        }
    }).catch(err => {
        alert("Erreur lors de l'upload du son");
        console.error(err);
    });
}

async function deleteProject(id) {
    if (confirm('Voulez-vous vraiment supprimer ce projet ?')) {
        projectsData = projectsData.filter(p => String(p.id) !== String(id));
        await window.StorageDB.set('hs4all_projects', projectsData);
        renderProjects();
    }
}

// ============================================
// Text Management UI — Portuguese only, auto-translate to other langs on save
// ============================================
function renderTexts() {
    const container = document.getElementById('textsList');
    if (!container) return;
    container.innerHTML = '';

    if (!window.translations || !window.translations.pt) {
        container.innerHTML = '<p style="color:red;">Erro: ficheiro translations.js não encontrado.</p>';
        return;
    }

    // Status message area
    const statusEl = document.createElement('div');
    statusEl.id = 'textsStatus';
    statusEl.style.cssText = 'margin-bottom:16px; padding:10px 16px; border-radius:8px; display:none; font-weight:500;';
    container.appendChild(statusEl);

    function showStatus(msg, isError = false) {
        statusEl.textContent = msg;
        statusEl.style.background = isError ? '#fee2e2' : '#d1fae5';
        statusEl.style.color = isError ? '#b91c1c' : '#065f46';
        statusEl.style.display = 'block';
        if (!isError) setTimeout(() => statusEl.style.display = 'none', 4000);
    }

    // Save button
    const saveAllBtn = document.createElement('button');
    saveAllBtn.className = 'save-btn';
    saveAllBtn.style.marginBottom = '24px';
    saveAllBtn.textContent = '💾 Guardar e Traduzir Automaticamente';
    saveAllBtn.onclick = async () => {
        saveAllBtn.disabled = true;
        saveAllBtn.textContent = '⏳ A processar...';
        showStatus('A verificar alterações...', false);

        try {
            // Collect all PT texts from inputs and textareas
            const ptInputs = container.querySelectorAll('.text-input[data-lang="pt"]');
            const ptTexts = {};
            ptInputs.forEach(el => {
                ptTexts[el.getAttribute('data-key')] = el.value;
            });

            // Make a clone of current textsData to update
            const updatedTexts = JSON.parse(JSON.stringify(textsData));
            const langs = ['fr', 'en', 'es'];

            // Ensure language objects exist
            updatedTexts.pt = updatedTexts.pt || {};
            langs.forEach(l => { updatedTexts[l] = updatedTexts[l] || {}; });

            // Find which PT keys actually changed compared to currently saved
            const changedKeys = [];
            Object.keys(ptTexts).forEach(key => {
                if (ptTexts[key] !== updatedTexts.pt[key]) {
                    changedKeys.push(key);
                }
                updatedTexts.pt[key] = ptTexts[key]; // Always update PT
            });

            if (changedKeys.length === 0) {
                // Nothing to translate, just save the object as is
                textsData = updatedTexts;
                if (window.StorageDB) await window.StorageDB.set('hs4all_texts', textsData);
                showStatus('✅ Nenhuma tradução necessária. Guardado com sucesso!');
            } else {
                showStatus(`A traduzir ${changedKeys.length} textos modificados para FR, EN, ES...`);
                let translated = 0;
                const totalToTranslate = changedKeys.length * langs.length;

                const keysToSkip = ['contact.email', 'contact.phone', 'contact.address'];
                for (const key of changedKeys) {
                    const ptText = ptTexts[key];
                    if (!ptText || !ptText.trim()) continue;

                    if (keysToSkip.includes(key)) {
                        for (const targetLang of langs) {
                            updatedTexts[targetLang][key] = ptText;
                        }
                        continue;
                    }

                    for (const targetLang of langs) {
                        try {
                            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(ptText)}&langpair=pt|${targetLang}`;
                            const res = await fetch(url);
                            const data = await res.json();
                            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                                // Strip any HTML/SVG/Artifact tags the API may have injected
                                let clean = data.responseData.translatedText;
                                // Aggressive regex to remove all tags EXCEPT <br>
                                clean = clean.replace(/<(?!br\b)[^>]*>?/gm, '');
                                // Also remove any remaining strange quote artifacts
                                clean = clean.replace(/[’'"]( ?)[’”"]/g, '');
                                updatedTexts[targetLang][key] = clean.trim();
                            } else {
                                // Fallback: keep existing saved translation, then static default — never overwrite with PT text
                                const existing = (textsData[targetLang] && textsData[targetLang][key]) || '';
                                const staticDefault = (window.translations[targetLang] && window.translations[targetLang][key]) || '';
                                updatedTexts[targetLang][key] = existing || staticDefault || ptText;
                            }
                        } catch (err) {
                            console.error('Translation failed for', key, targetLang, err);
                            // Fallback: keep existing saved translation, then static default
                            const existing = (textsData[targetLang] && textsData[targetLang][key]) || '';
                            const staticDefault = (window.translations[targetLang] && window.translations[targetLang][key]) || '';
                            updatedTexts[targetLang][key] = existing || staticDefault || ptText;
                        }
                        translated++;
                        showStatus(`A traduzir... ${translated}/${totalToTranslate} concluídas`);
                    }
                }

                textsData = updatedTexts;
                if (window.StorageDB) {
                    await window.StorageDB.set('hs4all_texts', textsData);
                }
                showStatus('✅ Textos traduzidos e guardados com sucesso!');
            }
        } catch (err) {
            console.error('Erro ao guardar textos:', err);
            showStatus('❌ Erro ao guardar. Verifique a consola.', true);
        } finally {
            saveAllBtn.disabled = false;
            saveAllBtn.textContent = '💾 Guardar e Traduzir Automaticamente';
        }
    };
    container.appendChild(saveAllBtn);

    // Mapping of sections and their friendly labels
    const SECTIONS = [
        { id: 'identity', label: '🌟 Identité & Contact', keys: ['logo.text', 'contact.email', 'contact.phone', 'contact.address'] },
        { id: 'nav', label: '🔗 Navigation', prefix: 'nav.' },
        { id: 'hero', label: '🏠 Hero Section (Haut de page)', prefix: 'hero.' },
        { id: 'philo', label: '🌿 Philosophie', prefix: 'philo.' },
        { id: 'tech', label: '🛠️ Technique & Finitions', prefix: 'tech.' },
        { id: 'comfort', label: '🏠 Confort & Isolation', prefix: 'comfort.' },
        { id: 'concept', label: '📐 Concept Modulaire', prefix: 'concept.' },
        { id: 'process', label: '⚙️ Notre Savoir-faire', prefix: 'process.' },
        { id: 'sustainability', label: '🌍 Engagement Durable', prefix: 'sus.' },
        { id: 'projects', label: '📸 Projets & Réalisations', prefix: 'projects.' },
        { id: 'contact_form', label: '✉️ Formulaire de Contact', prefix: 'contact.form.' },
        { id: 'footer', label: '📍 Pied de page', prefix: 'footer.' }
    ];

    // Friendly labels for specific keys
    const KEY_LABELS = {
        'logo.text': 'Nom du Logo / Marque',
        'contact.email': 'Email de contact principal',
        'contact.phone': 'Numéro de téléphone',
        'contact.address': 'Adresse de l\'atelier (HTML supporté)',
        'nav.philosophy': 'Menu: Philosophie',
        'nav.construction': 'Menu: Construction',
        'hero.title.1': 'Titre Hero (Ligne 1)',
        'hero.title.2': 'Titre Hero (Ligne 2)',
        'hero.tagline': 'Sous-titre Hero (Description)',
        'contact.form.send': 'Bouton Envoyer',
        'footer.copyright': 'Texte Copyright (Pied de page)'
    };

    container.appendChild(saveAllBtn);

    const allKeys = Object.keys(window.translations.pt);
    const renderedKeys = new Set();

    SECTIONS.forEach(section => {
        // Find keys for this section
        const sectionKeys = allKeys.filter(k => {
            if (renderedKeys.has(k)) return false;
            if (section.keys && section.keys.includes(k)) return true;
            if (section.prefix && k.startsWith(section.prefix)) return true;
            return false;
        });

        if (sectionKeys.length === 0 && section.id !== 'identity') return;

        // Section header
        const header = document.createElement('h3');
        header.style.cssText = 'margin-top:30px; margin-bottom:15px; padding-bottom:8px; border-bottom:2px solid #eee; color:#222; font-size:18px;';
        header.textContent = section.label;
        container.appendChild(header);

        // Special handling for Identity section to add Image Upload
        if (section.id === 'identity') {
            const imgBlock = document.createElement('div');
            imgBlock.className = 'text-block pretty-block';
            imgBlock.style.cssText = 'margin-bottom:12px; padding:14px 16px; border-radius:8px; background:#f0f4f8; border:1px solid #d0dce8;';
            imgBlock.innerHTML = `
                <div style="font-weight:600; margin-bottom:8px; color:#2c3e50; font-size:13px;">🖼️ Image du Logo</div>
                <div style="font-size:11px; color:#7f8c8d; margin-bottom:10px;">Téléchargez une image pour remplacer le texte du logo (PNG, JPG, SVG).</div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <input type="file" id="logoImgInput" accept="image/*" style="display:none;">
                    <button class="btn-action" onclick="document.getElementById('logoImgInput').click()" 
                        style="background:#3498db; color:white; padding:8px 16px; border-radius:4px; font-size:12px;">Choisir une image</button>
                    <button class="btn-action" id="downloadLogoBtn"
                        style="background:#27ae60; color:white; padding:8px 16px; border-radius:4px; font-size:12px; display:none;">Télécharger</button>
                    <button class="btn-action" id="deleteLogoBtn"
                        style="background:#e74c3c; color:white; padding:8px 16px; border-radius:4px; font-size:12px; display:none;">Supprimer l'image</button>
                </div>
                <div id="logoPreview" style="margin-top:15px; display:none;">
                    <img id="logoPreviewImg" src="" style="max-height:60px; border:1px solid #eee; padding:5px; background:white;">
                </div>
            `;
            container.appendChild(imgBlock);

            const input = imgBlock.querySelector('#logoImgInput');
            const downloadBtn = imgBlock.querySelector('#downloadLogoBtn');
            const deleteBtn = imgBlock.querySelector('#deleteLogoBtn');
            const preview = imgBlock.querySelector('#logoPreview');
            const previewImg = imgBlock.querySelector('#logoPreviewImg');

            // Load existing logo image if any
            window.StorageDB.get('hs4all_logo_img').then(data => {
                if (data) {
                    previewImg.src = data;
                    preview.style.display = 'block';
                    deleteBtn.style.display = 'block';
                    downloadBtn.style.display = 'block';
                }
            });

            input.onchange = (e) => handleLogoImgChange(e);
            downloadBtn.onclick = () => downloadLogoImage();
            deleteBtn.onclick = () => deleteLogoImage();
        }

        sectionKeys.forEach(key => {
            renderedKeys.add(key);
            const ptDefault = window.translations.pt[key] || '';
            const ptSaved = (textsData.pt && textsData.pt[key] !== undefined) ? textsData.pt[key] : ptDefault;
            const label = KEY_LABELS[key] || key;

            const block = document.createElement('div');
            block.className = 'text-block pretty-block';
            block.style.cssText = 'margin-bottom:12px; padding:14px 16px; border-radius:8px; background:#f9f9f9; border:1px solid #eee;';
            block.innerHTML = `
                <div style="font-weight:600; margin-bottom:8px; color:#556; font-size:13px;">${label}</div>
                <div style="font-size:10px; color:#99a; margin-bottom:6px; font-family:monospace;">Code: ${key}</div>
                <textarea class="text-input" data-key="${key}" data-lang="pt"
                    style="width:100%; min-height:55px; padding:10px; border:1px solid #ddd; border-radius:6px; font-family:inherit; font-size:13px; resize:vertical; box-sizing:border-box;">${ptSaved}</textarea>
            `;
            container.appendChild(block);
        });
    });

    // Render remaining keys
    const otherKeys = allKeys.filter(k => !renderedKeys.has(k));
    if (otherKeys.length > 0) {
        const otherHeader = document.createElement('h3');
        otherHeader.style.cssText = 'margin-top:30px; margin-bottom:15px; padding-bottom:8px; border-bottom:2px solid #eee; color:#222; font-size:18px;';
        otherHeader.textContent = '📦 Autres Textes';
        container.appendChild(otherHeader);

        otherKeys.forEach(key => {
            const ptDefault = window.translations.pt[key] || '';
            const ptSaved = (textsData.pt && textsData.pt[key] !== undefined) ? textsData.pt[key] : ptDefault;

            const block = document.createElement('div');
            block.className = 'text-block pretty-block';
            block.style.cssText = 'margin-bottom:12px; padding:14px 16px; border-radius:8px; background:#f9f9f9; border:1px solid #eee;';
            block.innerHTML = `
                <div style="font-weight:600; margin-bottom:8px; color:#556; font-size:13px; font-family:monospace;">${key}</div>
                <textarea class="text-input" data-key="${key}" data-lang="pt"
                    style="width:100%; min-height:55px; padding:10px; border:1px solid #ddd; border-radius:6px; font-family:inherit; font-size:13px; resize:vertical; box-sizing:border-box;">${ptSaved}</textarea>
            `;
            container.appendChild(block);
        });
    }
}

// ============================================
// Social Media Settings UI
// ============================================
function renderSocialSettings() {
    const fbInput = document.getElementById('socialFacebook');
    const fbCheck = document.getElementById('showFacebook');
    const igInput = document.getElementById('socialInstagram');
    const igCheck = document.getElementById('showInstagram');
    const liInput = document.getElementById('socialLinkedin');
    const liCheck = document.getElementById('showLinkedin');
    const piInput = document.getElementById('socialPinterest');
    const piCheck = document.getElementById('showPinterest');
    const saveBtn = document.getElementById('saveSocialSettings');

    if (!saveBtn) return;

    // Load data into inputs
    if (fbInput) fbInput.value = socialSettingsData.facebook || '';
    if (fbCheck) fbCheck.checked = socialSettingsData.facebookVisible !== false;

    if (igInput) igInput.value = socialSettingsData.instagram || '';
    if (igCheck) igCheck.checked = socialSettingsData.instagramVisible !== false;

    if (liInput) liInput.value = socialSettingsData.linkedin || '';
    if (liCheck) liCheck.checked = socialSettingsData.linkedinVisible !== false;

    if (piInput) piInput.value = socialSettingsData.pinterest || '';
    if (piCheck) piCheck.checked = socialSettingsData.pinterestVisible !== false;

    saveBtn.onclick = async () => {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '⏳ A guardar...';
        saveBtn.disabled = true;

        try {
            socialSettingsData = {
                facebook: fbInput.value.trim(),
                facebookVisible: fbCheck.checked,
                instagram: igInput.value.trim(),
                instagramVisible: igCheck.checked,
                linkedin: liInput.value.trim(),
                linkedinVisible: liCheck.checked,
                pinterest: piInput.value.trim(),
                pinterestVisible: piCheck.checked
            };

            await window.StorageDB.set('hs4all_social_settings', socialSettingsData);
            alert('Configurações de redes sociais guardadas com sucesso!');
        } catch (err) {
            console.error('Erro ao guardar redes sociais:', err);
            alert('Erro ao guardar as configurações.');
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    };
}

// ============================================
// Helper
// ============================================
function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}

// ============================================
// Logo Image Management
// ============================================
async function handleLogoImgChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // Increased to 5MB since it's Storage now
        alert("L'image est trop grande (max 5MB)");
        return;
    }

    try {
        const path = `logo/logo_${Date.now()}_${file.name}`;
        const url = await window.StorageDB.uploadFile(path, file);
        await window.StorageDB.set('hs4all_logo_img', url);

        // Update UI locally
        const preview = document.getElementById('logoPreview');
        const previewImg = document.getElementById('logoPreviewImg');
        const deleteBtn = document.getElementById('deleteLogoBtn');

        if (previewImg) previewImg.src = url;
        if (preview) preview.style.display = 'block';
        if (deleteBtn) deleteBtn.style.display = 'block';
        const downloadBtn = document.getElementById('downloadLogoBtn');
        if (downloadBtn) downloadBtn.style.display = 'block';

        alert("Logo mis à jour !");
    } catch (err) {
        alert("Erreur lors de l'upload du logo");
        console.error(err);
    }
}

async function downloadLogoImage() {
    try {
        const logoImgData = await window.StorageDB.get('hs4all_logo_img');
        if (!logoImgData) {
            alert("Aucune image de logo à télécharger.");
            return;
        }

        // Determine extension from base64 string
        let extension = 'png';
        const match = logoImgData.match(/^data:image\/([a-zA-Z+]+);base64,/);
        if (match && match[1]) {
            extension = match[1].split('+')[0]; // handle cases like image/svg+xml
            if (extension === 'svg+xml') extension = 'svg';
        }

        const link = document.createElement('a');
        link.href = logoImgData;
        link.download = `logo-hs4all.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error('Download failed:', e);
        alert("Erreur lors du téléchargement de l'image.");
    }
}

async function deleteLogoImage() {
    if (!confirm("Voulez-vous vraiment supprimer l'image du logo et revenir au texte ?")) return;

    await window.StorageDB.set('hs4all_logo_img', null);

    // Update UI
    const preview = document.getElementById('logoPreview');
    const deleteBtn = document.getElementById('deleteLogoBtn');
    const downloadBtn = document.getElementById('downloadLogoBtn');

    if (preview) preview.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';

    alert("Image du logo supprimée.");
}

// Global exposure
window.handleLogoImgChange = handleLogoImgChange;
window.downloadLogoImage = downloadLogoImage;
window.deleteLogoImage = deleteLogoImage;

// ============================================
// Authentication
// ============================================
function showAdmin() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'block';
    window.adminIsLoggedIn = true;
    // Always render immediately with whatever data is available (defaults if Firebase not loaded yet)
    // If Firebase loads afterward, initAdminData() will call renderAll() again with real data
    if (fixedVisualsData.length === 0) fixedVisualsData = defaultFixedVisuals;
    if (projectsData.length === 0) projectsData = defaultProjects;
    renderAll();
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('adminContainer').style.display = 'none';
    window.adminIsLoggedIn = false;
}

function doLogin(password) {
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminAuth', 'true');
        showAdmin();
    } else {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 3000);
        }
    }
}

function doLogout() {
    localStorage.removeItem('adminAuth');
    showLogin();
}

// ============================================
// DOMContentLoaded - Initialize everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            doLogin(document.getElementById('password').value);
        };
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = doLogout;

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });

    // Project modal
    const modal = document.getElementById('projectModal');
    const addProjectBtn = document.getElementById('addProjectBtn');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const projectForm = document.getElementById('projectForm');

    if (addProjectBtn) addProjectBtn.onclick = () => modal && modal.classList.add('active');
    if (modalClose) modalClose.onclick = () => modal && modal.classList.remove('active');
    if (modalCancel) modalCancel.onclick = () => modal && modal.classList.remove('active');

    if (projectForm) {
        projectForm.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = projectForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'A guardar...';
            submitBtn.disabled = true;
            try {
                const maxId = projectsData.length > 0 ? Math.max(...projectsData.map(p => Number(p.id))) : 0;
                const newId = maxId + 1;

                // Handle uploads to Storage
                const extImgFile = document.getElementById('projectExtImg')?.files?.[0];
                const extSoundFile = document.getElementById('projectExtSound')?.files?.[0];
                const intImgFile = document.getElementById('projectIntImg')?.files?.[0];
                const intSoundFile = document.getElementById('projectIntSound')?.files?.[0];

                const img1 = extImgFile ? await window.StorageDB.uploadFile(`projects/p${newId}_img1_${Date.now()}`, extImgFile) : 'assets/images/placeholder.jpg';
                const sound1 = extSoundFile ? await window.StorageDB.uploadFile(`projects/p${newId}_sound1_${Date.now()}`, extSoundFile) : '';
                const img2 = intImgFile ? await window.StorageDB.uploadFile(`projects/p${newId}_img2_${Date.now()}`, intImgFile) : 'assets/images/placeholder.jpg';
                const sound2 = intSoundFile ? await window.StorageDB.uploadFile(`projects/p${newId}_sound2_${Date.now()}`, intSoundFile) : '';

                projectsData.push({ id: newId, title: `Projeto #${newId}`, img1, sound1, img2, sound2 });
                await window.StorageDB.set('hs4all_projects', projectsData);
                renderProjects();
                projectForm.reset();
                if (modal) modal.classList.remove('active');
            } catch (err) {
                console.error('Erro ao guardar projeto:', err);
                alert('Ocorreu um erro ao guardar o projeto.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        };
    }

    // Check existing auth
    window.adminIsLoggedIn = false;
    if (localStorage.getItem('adminAuth') === 'true') {
        showAdmin();
    } else {
        showLogin();
    }

    // Load data from Firebase — poll for StorageDB since the StorageDBReady event
    // may have already fired before this script registered its listener
    function waitForStorageDB(callback, maxWait = 8000) {
        if (window.StorageDB) {
            callback();
            return;
        }
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 100;
            if (window.StorageDB) {
                clearInterval(interval);
                callback();
            } else if (elapsed >= maxWait) {
                clearInterval(interval);
                console.warn('StorageDB not available after ' + maxWait + 'ms, using defaults');
                // Data already set to defaults in showAdmin(), nothing more to do
            }
        }, 100);
    }

    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; 
            padding: 12px 24px; background: ${type === 'loading' ? '#444' : '#222'}; 
            color: #fff; border-radius: 8px; font-family: sans-serif; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999; animation: slideIn 0.3s ease-out;
            border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'loading' ? '#ff9800' : '#f44336'};
            display: flex; align-items: center; gap: 10px;
        `;
        toast.id = 'hs4all-toast';
        const existing = document.getElementById('hs4all-toast');
        if (existing) existing.remove();

        toast.textContent = msg;
        document.body.appendChild(toast);
        if (type !== 'loading') {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s ease-out';
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }
    }

    const toastStyle = document.createElement('style');
    toastStyle.textContent = `@keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
    document.head.appendChild(toastStyle);

    window.addEventListener('StorageDBUpdating', (e) => {
        showToast(`Enregistrement de ${e.detail.key.replace('hs4all_', '')}...`, 'loading');
    });

    window.addEventListener('StorageDBUpdated', (e) => {
        if (e.detail.remote) {
            showToast(`✅ ${e.detail.key.replace('hs4all_', '')} sauvegardé !`, 'success');
        } else {
            showToast(`⚠️ ${e.detail.key.replace('hs4all_', '')} sauvegardé localement (Hors ligne)`, 'error');
        }
    });

    waitForStorageDB(initAdminData);
});
