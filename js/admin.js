// ============================================
// Admin Dashboard JavaScript
// ============================================

const ADMIN_PASSWORD = 'hs4all2024';

let projectsData = [];
let fixedVisualsData = [];
let textsData = {};

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
    try {
        const rawProjects = await window.StorageDB.get('hs4all_projects');
        projectsData = normalizeArray(rawProjects, defaultProjects);

        const rawVisuals = await window.StorageDB.get('hs4all_fixed_visuals');
        fixedVisualsData = normalizeArray(rawVisuals, defaultFixedVisuals);

        const rawTexts = await window.StorageDB.get('hs4all_texts');
        textsData = (rawTexts && typeof rawTexts === 'object') ? rawTexts : {};

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
}

function renderAll() {
    renderFixedVisuals();
    renderProjects();
    renderTexts();
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
    const reader = new FileReader();
    reader.onload = async (e) => {
        const idx = fixedVisualsData.findIndex(v => v.id === id);
        if (idx !== -1) {
            fixedVisualsData[idx].img = e.target.result;
            await window.StorageDB.set('hs4all_fixed_visuals', fixedVisualsData);
            renderFixedVisuals();
        }
    };
    reader.readAsDataURL(file);
}

function handleFixedVisualAudioChange(id, event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const idx = fixedVisualsData.findIndex(v => v.id === id);
        if (idx !== -1) {
            fixedVisualsData[idx].sound = e.target.result;
            await window.StorageDB.set('hs4all_fixed_visuals', fixedVisualsData);
            renderFixedVisuals();
        }
    };
    reader.readAsDataURL(file);
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
    const reader = new FileReader();
    reader.onload = async (e) => {
        const idx = projectsData.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            projectsData[idx][`img${imgNum}`] = e.target.result;
            await window.StorageDB.set('hs4all_projects', projectsData);
            renderProjects();
        }
    };
    reader.readAsDataURL(file);
}

function handleProjectSoundChange(id, soundNum, event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const idx = projectsData.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) {
            projectsData[idx][`sound${soundNum}`] = e.target.result;
            await window.StorageDB.set('hs4all_projects', projectsData);
            renderProjects();
        }
    };
    reader.readAsDataURL(file);
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
            // Collect all PT texts from textareas
            const ptInputs = container.querySelectorAll('textarea[data-lang="pt"]');
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

                for (const key of changedKeys) {
                    const ptText = ptTexts[key];
                    if (!ptText || !ptText.trim()) continue;

                    for (const targetLang of langs) {
                        try {
                            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(ptText)}&langpair=pt|${targetLang}`;
                            const res = await fetch(url);
                            const data = await res.json();
                            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                                // Strip any HTML/SVG tags the API may have injected
                                const tmp = document.createElement('div');
                                tmp.innerHTML = data.responseData.translatedText;
                                const clean = tmp.textContent || tmp.innerText || data.responseData.translatedText;
                                updatedTexts[targetLang][key] = clean;
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

    // Render only PT fields
    const baseKeys = Object.keys(window.translations.pt);
    baseKeys.forEach(key => {
        const ptDefault = window.translations.pt[key] || '';
        const ptSaved = (textsData.pt && textsData.pt[key] !== undefined) ? textsData.pt[key] : ptDefault;

        const block = document.createElement('div');
        block.className = 'text-block pretty-block';
        block.style.cssText = 'margin-bottom:12px; padding:14px 16px; border-radius:8px;';
        block.innerHTML = `
            <div style="font-weight:600; margin-bottom:8px; color:#556; font-size:12px; font-family:monospace;">${key}</div>
            <textarea data-key="${key}" data-lang="pt"
                style="width:100%; min-height:55px; padding:8px; border:1px solid #e0e0e0; border-radius:6px; font-family:inherit; font-size:13px; resize:vertical; box-sizing:border-box;">${ptSaved}</textarea>
        `;
        container.appendChild(block);
    });
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
                const img1 = await readFileAsDataURL(document.getElementById('projectExtImg')?.files?.[0]) || 'assets/images/placeholder.jpg';
                const sound1 = await readFileAsDataURL(document.getElementById('projectExtSound')?.files?.[0]) || '';
                const img2 = await readFileAsDataURL(document.getElementById('projectIntImg')?.files?.[0]) || 'assets/images/placeholder.jpg';
                const sound2 = await readFileAsDataURL(document.getElementById('projectIntSound')?.files?.[0]) || '';
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

    waitForStorageDB(initAdminData);
});
