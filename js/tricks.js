// ShunsKating - Lógica das manobras

// Variável global para armazenar os dados
let tricksData = null;
let currentTrick = null;
let mediaRecorder = null;
let recordedChunks = [];
let currentCategory = null;

// Stance atual na tela de detalhes
let currentDetailStance = 'regular';

// Stances que compartilham dicas
const sharedTipsStances = {
    regular: 'regular',
    switch: 'regular',
    fakie: 'fakie',
    nollie: 'fakie'
};

// Sistema de favoritos
function loadFavorites() {
    const favs = localStorage.getItem('shunskating-favorites');
    return favs ? JSON.parse(favs) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('shunskating-favorites', JSON.stringify(favorites));
}

function isFavorite(trickId) {
    const favorites = loadFavorites();
    return favorites.includes(trickId);
}

function toggleFavorite(trickId) {
    let favorites = loadFavorites();
    if (favorites.includes(trickId)) {
        favorites = favorites.filter(id => id !== trickId);
    } else {
        favorites.push(trickId);
    }
    saveFavorites(favorites);
    return favorites.includes(trickId);
}

function updateFavoriteButton() {
    const btn = document.getElementById('btn-favorite');
    if (btn && currentTrick) {
        if (isFavorite(currentTrick.id)) {
            btn.textContent = '★';
            btn.classList.add('favorited');
        } else {
            btn.textContent = '☆';
            btn.classList.remove('favorited');
        }
    }
}

// Carrega progresso salvo no LocalStorage
function loadProgress() {
    const saved = localStorage.getItem('shunskating-progress');
    if (!saved) return {};
    try {
        return JSON.parse(saved) || {};
    } catch (e) {
        console.error('Erro ao parsear progresso salvo:', e);
        return {};
    }
}

// Salva progresso de uma manobra (por stance)
function saveProgress(trickId, progressValue) {
    const progress = loadProgress();
    const key = trickId + '_' + currentDetailStance;
    progress[key] = progressValue;
    localStorage.setItem('shunskating-progress', JSON.stringify(progress));
    console.log('Progresso salvo:', key, progressValue);
}

// Obtém progresso de uma manobra (por stance)
function getProgress(trickId) {
    const progress = loadProgress();
    const key = trickId + '_' + currentDetailStance;
    return progress[key] ?? 0;
}

// Textos dos níveis de progresso
const progressLabels = [
    'Não sei',
    'Tô aprendendo', 
    'Acerto às vezes',
    'Tô pegando a base',
    'Tá na base'
];

// Atualiza a barra de progresso visual
function updateProgressBar(progressValue) {
    const segments = document.querySelectorAll('.progress-segment');
    const currentText = document.getElementById('progress-current-text');
    
    segments.forEach((seg, index) => {
        seg.classList.remove('selected');
        if (index === progressValue) {
            seg.classList.add('selected');
        }
    });
    
    if (currentText) {
        currentText.textContent = progressLabels[progressValue] || 'Não sei';
    }
}

// ---- Vídeos ----
function loadVideos() {
    const saved = localStorage.getItem('shunskating-videos');
    if (!saved) return {};
    try {
        return JSON.parse(saved) || {};
    } catch (e) {
        console.error('Erro ao parsear vídeos salvos:', e);
        return {};
    }
}

function saveVideoBlob(trickId, dataUrl) {
    const videos = loadVideos();
    if (!videos[trickId]) videos[trickId] = [];
    videos[trickId].push({ data: dataUrl, date: Date.now() });
    localStorage.setItem('shunskating-videos', JSON.stringify(videos));
}

async function openCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: true
        });
        const preview = document.getElementById('video-preview');
        if (preview) {
            preview.srcObject = stream;
            await preview.play();
        }
        return stream;
    } catch (err) {
        console.error('Erro ao acessar câmera:', err);
        alert('Não foi possível acessar a câmera.');
        return null;
    }
}

function closeCamera() {
    const preview = document.getElementById('video-preview');
    if (preview && preview.srcObject) {
        const stream = preview.srcObject;
        stream.getTracks().forEach(track => track.stop());
        preview.srcObject = null;
    }
}

function startRecording(stream) {
    if (!stream) return;
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        saveVideo();
    };

    mediaRecorder.start();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    closeCamera();
}

async function saveVideo() {
    if (!currentTrick || recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    recordedChunks = [];

    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result;
        saveVideoBlob(currentTrick.id, dataUrl);
        renderVideos(currentTrick.id);
        const modalVideo = document.getElementById('modal-video');
        if (modalVideo) modalVideo.classList.remove('active');
    };
    reader.readAsDataURL(blob);
}

function deleteVideo(trickId, index) {
    const videos = loadVideos();
    if (!videos[trickId]) return;
    videos[trickId].splice(index, 1);
    localStorage.setItem('shunskating-videos', JSON.stringify(videos));
    renderVideos(trickId);
}

function renderVideos(trickId) {
    const container = document.getElementById('videos-container');
    if (!container) return;

    const videos = loadVideos();
    const trickVideos = videos[trickId] || [];

    if (trickVideos.length === 0) {
        container.innerHTML = '<p class="empty-videos">Nenhum vídeo gravado ainda.</p>';
        return;
    }

    container.innerHTML = '';

    trickVideos.forEach((video, index) => {
        const item = document.createElement('div');
        item.className = 'video-item';

        const vid = document.createElement('video');
        vid.className = 'video-thumb';
        vid.src = video.data;
        vid.controls = true;

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete';
        delBtn.dataset.index = index;
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => {
            deleteVideo(trickId, index);
        });

        item.appendChild(vid);
        item.appendChild(delBtn);
        container.appendChild(item);
    });
}

// ---- Links Externos ----
function loadLinks() {
    const saved = localStorage.getItem('shunskating-links');
    if (!saved) return {};
    try {
        return JSON.parse(saved) || {};
    } catch (e) {
        console.error('Erro ao parsear links salvos:', e);
        return {};
    }
}

function saveLink(trickId, url, title) {
    const links = loadLinks();
    if (!links[trickId]) links[trickId] = [];
    links[trickId].push({ url, title: title || url });
    localStorage.setItem('shunskating-links', JSON.stringify(links));
}

function deleteLink(trickId, index) {
    const links = loadLinks();
    if (!links[trickId]) return;
    links[trickId].splice(index, 1);
    localStorage.setItem('shunskating-links', JSON.stringify(links));
    renderLinks(trickId);
}

function renderLinks(trickId) {
    const container = document.getElementById('links-container');
    if (!container) return;

    const links = loadLinks();
    const trickLinks = links[trickId] || [];

    if (trickLinks.length === 0) {
        container.innerHTML = '<p class="empty-links">Nenhum link adicionado.</p>';
        return;
    }

    container.innerHTML = '';

    trickLinks.forEach((link, index) => {
        const item = document.createElement('div');
        item.className = 'link-item';

        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = link.title || link.url;

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-delete';
        delBtn.dataset.index = index;
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => {
            deleteLink(trickId, index);
        });

        item.appendChild(anchor);
        item.appendChild(delBtn);
        container.appendChild(item);
    });
}

// ---- Notas Pessoais ----
function loadNotes() {
    const notes = localStorage.getItem('shunskating-notes');
    return notes ? JSON.parse(notes) : {};
}

function saveNotes(trickId, noteText) {
    const notes = loadNotes();
    const key = trickId + '_' + currentDetailStance;
    notes[key] = noteText;
    localStorage.setItem('shunskating-notes', JSON.stringify(notes));
    console.log('Notas salvas:', key, noteText);
}

function getNotes(trickId) {
    const notes = loadNotes();
    const key = trickId + '_' + currentDetailStance;
    return notes[key] || '';
}

// Dicas compartilhadas (regular/switch juntos, fakie/nollie juntos)
function getTipsKey(trickId) {
    const sharedStance = sharedTipsStances[currentDetailStance];
    return trickId + '_' + sharedStance;
}

// Carrega os dados das manobras
async function loadTricks() {
    try {
        console.log('🔄 Tentando carregar tricks.json...');
        const response = await fetch('./data/tricks.json');
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        tricksData = await response.json();
        console.log('✅ Tricks carregados com sucesso:', tricksData);
        return tricksData;
    } catch (error) {
        console.error('❌ Erro ao carregar manobras:', error);
        console.error('Caminho tentado: ./data/tricks.json');
        return null;
    }
}

// Renderiza as manobras na tela
function renderTricks(category, filter = 'todas') {
    const container = document.getElementById('tricks-container');
    
    if (!tricksData || !tricksData[category]) {
        container.innerHTML = '<p>Nenhuma manobra encontrada.</p>';
        return;
    }
    
    let tricks = [...tricksData[category]]; // Copia o array
    
    // Aplica filtro de dificuldade
    if (filter !== 'todas') {
        if (filter === 'facil') {
            tricks = tricks.filter(trick => trick.difficulty <= 2);
        } else if (filter === 'intermediaria') {
            tricks = tricks.filter(trick => trick.difficulty === 3);
        } else if (filter === 'dificil') {
            tricks = tricks.filter(trick => trick.difficulty >= 4);
        }
    }
    
    // Ordena: favoritos primeiro
    const favorites = loadFavorites();
    tricks.sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 0 : 1;
        const bFav = favorites.includes(b.id) ? 0 : 1;
        return aFav - bFav;
    });
    
    container.innerHTML = '';
    
    if (tricks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Nenhuma manobra encontrada neste filtro.</p>';
        return;
    }
    
    tricks.forEach(trick => {
        const card = document.createElement('div');
        card.className = 'trick-card';
        card.dataset.trickId = trick.id;
        
        // Marca favorito visualmente
        if (isFavorite(trick.id)) {
            card.classList.add('favorited');
        }
        
        const name = document.createElement('span');
        name.className = 'trick-name';
        name.textContent = trick.name;
        
        // Adiciona estrela se favorito
        if (isFavorite(trick.id)) {
            const star = document.createElement('span');
            star.className = 'favorite-star';
            star.textContent = '★';
            name.appendChild(star);
        }
        
        // Cria as bolinhas de dificuldade
        const diffContainer = document.createElement('div');
        diffContainer.className = 'difficulty-dots';
        
        for (let i = 1; i <= 5; i++) {
            const dot = document.createElement('span');
            dot.className = 'difficulty-dot';
            if (i <= trick.difficulty) {
                dot.classList.add('filled');
            }
            diffContainer.appendChild(dot);
        }
        
        card.appendChild(name);
        card.appendChild(diffContainer);
        container.appendChild(card);
        
        card.addEventListener('click', () => {
            showTrickDetail(trick.id);
        });
    });
}

// Inicializa a tela de lista de manobras
function initTrickList(category) {
    console.log('📋 initTrickList chamado');
    console.log('   Categoria:', category);
    console.log('   Dados disponíveis:', tricksData);
    
    currentCategory = category;
    
    // Atualiza o título com o nome da categoria
    const categoryTitle = document.getElementById('category-title');
    const categoryNames = {
        'flatground': 'FLATGROUND',
        'slides': 'SLIDES',
        'grinds': 'GRINDS'
    };
    categoryTitle.textContent = categoryNames[category] || category.toUpperCase();
    
    // Renderiza as manobras
    renderTricks(category);
}

// Exibe os detalhes de uma manobra
function showTrickDetail(trickId) {
    if (!tricksData) return;

    // Busca a manobra em todas as categorias
    let foundTrick = null;
    let foundCategory = null;
    Object.keys(tricksData).forEach(cat => {
        const match = tricksData[cat].find(t => t.id === trickId);
        if (match) {
            foundTrick = match;
            foundCategory = cat;
        }
    });

    if (!foundTrick) {
        console.error('Manobra não encontrada:', trickId);
        return;
    }

    currentTrick = foundTrick;
    currentCategory = foundCategory;

    // Reset para stance regular ao abrir
    currentDetailStance = 'regular';

    // Esconde seletor de base se for categorias sem stance
    const stanceSwitcher = document.querySelector('.stance-switcher');
    const stanceLabel = document.getElementById('current-stance-label');
    
    if (currentCategory === 'manuais' || currentCategory === 'late' || currentCategory === 'flipinout') {
        if (stanceSwitcher) stanceSwitcher.style.display = 'none';
        if (stanceLabel) stanceLabel.style.display = 'none';
    } else {
        if (stanceSwitcher) stanceSwitcher.style.display = 'block';
        if (stanceLabel) stanceLabel.style.display = 'block';
    }

    // Atualiza badge de dificuldade
    const difficultyEl = document.getElementById('detail-difficulty-badge');
    if (difficultyEl) {
        const difficultyNames = {
            'facil': 'Fácil',
            'intermediaria': 'Média',
            'dificil': 'Difícil'
        };

        // Limpa classes antigas de difficulty-*
        difficultyEl.className = 'trick-difficulty';
        difficultyEl.classList.add(`difficulty-${currentTrick.difficulty}`);
        difficultyEl.textContent = difficultyNames[currentTrick.difficulty] || currentTrick.difficulty;
    }

    // Atualiza a tela de detalhes baseado na stance
    updateDetailForStance();

    // Atualiza botão de favorito
    updateFavoriteButton();

    // Navega para tela de detalhes
    showScreen('trick-detail');
}

// Nova função para atualizar a tela de detalhes baseado na stance
function updateDetailForStance() {
    if (!currentTrick) return;
    
    // Atualiza título com stance
    const title = document.getElementById('detail-title');
    if (title) {
        if (currentDetailStance === 'regular') {
            title.textContent = currentTrick.name;
        } else {
            const stanceLabel = currentDetailStance.charAt(0).toUpperCase() + currentDetailStance.slice(1);
            title.textContent = stanceLabel + ' ' + currentTrick.name;
        }
    }
    
    // Atualiza label da stance atual
    const stanceLabel = document.getElementById('current-stance-label');
    if (stanceLabel) {
        const labels = {
            regular: 'Base: Regular',
            fakie: 'Base: Fakie',
            nollie: 'Base: Nollie',
            switch: 'Base: Switch'
        };
        stanceLabel.textContent = labels[currentDetailStance];
    }
    
    // Atualiza botões de stance
    document.querySelectorAll('.stance-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-stance') === currentDetailStance) {
            btn.classList.add('active');
        }
    });
    
    // Atualiza dicas baseado na stance
    const tipsContent = document.getElementById('detail-tips');
    if (tipsContent && currentTrick) {
        let tips = '';
        
        // Regular e Switch usam 'tips'
        // Fakie e Nollie usam 'tipsFakie'
        if (currentDetailStance === 'regular' || currentDetailStance === 'switch') {
            tips = currentTrick.tips || '';
        } else {
            tips = currentTrick.tipsFakie || currentTrick.tips || '';
        }
        
        if (tips && tips !== '') {
            tipsContent.innerHTML = tips;
        } else {
            tipsContent.innerHTML = '<p class="empty-tips">Nenhuma dica adicionada ainda.</p>';
        }
    }

    // Aplica destaques salvos e inicializa sistema de highlight
    setTimeout(() => {
        if (typeof applyHighlights === 'function') {
            applyHighlights();
        }
        // Reinicializa listeners do sistema de highlight para o novo conteúdo
        if (typeof initHighlightSystem === 'function') {
            initHighlightSystem();
        }
    }, 100);
    
    // Atualiza progresso (único por stance)
    updateProgressBar(getProgress(currentTrick.id));
    
    // Atualiza notas pessoais (único por stance)
    const notesTextarea = document.getElementById('personal-notes');
    if (notesTextarea) {
        notesTextarea.value = getNotes(currentTrick.id);
    }
    
    // Atualiza vídeos e links (único por stance)
    renderVideos(currentTrick.id);
    renderLinks(currentTrick.id);
}

