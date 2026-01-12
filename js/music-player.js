// ==================== 
// PLAYER DE MÚSICA
// ====================

// Variáveis globais
let musicDB = null;
let playlist = [];
let currentTrackIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let audioElement = new Audio();
let selectedForSwap = null;

// ==================== 
// INDEXEDDB
// ====================

function initMusicDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ShunsKatingMusic', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            musicDB = request.result;
            resolve(musicDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tracks')) {
                const store = db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
                store.createIndex('name', 'name', { unique: false });
            }
        };
    });
}

function saveTrackToDB(trackData) {
    return new Promise((resolve, reject) => {
        const transaction = musicDB.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        const request = store.add(trackData);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllTracks() {
    return new Promise((resolve, reject) => {
        const transaction = musicDB.transaction(['tracks'], 'readonly');
        const store = transaction.objectStore('tracks');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteTrackFromDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = musicDB.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function updateTrackOrderInDB(tracks) {
    return new Promise(async (resolve, reject) => {
        try {
            const transaction = musicDB.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            
            // Limpa e readiciona na nova ordem
            await new Promise((res, rej) => {
                const clearReq = store.clear();
                clearReq.onsuccess = res;
                clearReq.onerror = rej;
            });
            
            for (const track of tracks) {
                await new Promise((res, rej) => {
                    const addReq = store.add(track);
                    addReq.onsuccess = res;
                    addReq.onerror = rej;
                });
            }
            
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

// ==================== 
// CARREGAR MÚSICAS
// ====================

async function loadPlaylist() {
    try {
        playlist = await getAllTracks();
        renderQueue();
        
        if (playlist.length > 0 && currentTrackIndex === -1) {
            currentTrackIndex = 0;
            loadTrack(currentTrackIndex);
        }
    } catch (error) {
        console.error('Erro ao carregar playlist:', error);
    }
}

async function addMusicFiles(files) {
    for (const file of files) {
        try {
            const trackData = await processAudioFile(file);
            const id = await saveTrackToDB(trackData);
            trackData.id = id;
            playlist.push(trackData);
        } catch (error) {
            console.error('Erro ao adicionar música:', error);
        }
    }
    
    renderQueue();
    
    if (playlist.length > 0 && currentTrackIndex === -1) {
        currentTrackIndex = 0;
        loadTrack(currentTrackIndex);
    }
    
    if (typeof AudioManager !== 'undefined') AudioManager.play('save');
}

function processAudioFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;
            
            // Extrai metadados se possível
            let title = file.name.replace(/\.[^/.]+$/, '');
            let artist = 'Artista Desconhecido';
            let cover = null;
            let duration = 0;
            
            // Tenta extrair duração
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
                duration = audioBuffer.duration;
                audioContext.close();
            } catch (err) {
                console.log('Não foi possível extrair duração');
            }
            
            // Tenta extrair metadados ID3 (simplificado)
            try {
                const metadata = await extractID3Metadata(arrayBuffer);
                if (metadata.title) title = metadata.title;
                if (metadata.artist) artist = metadata.artist;
                if (metadata.cover) cover = metadata.cover;
            } catch (err) {
                console.log('Não foi possível extrair metadados');
            }
            
            resolve({
                name: title,
                artist: artist,
                cover: cover,
                duration: duration,
                blob: new Blob([arrayBuffer], { type: file.type }),
                type: file.type
            });
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

// Extração simplificada de metadados ID3
function extractID3Metadata(arrayBuffer) {
    return new Promise((resolve) => {
        const metadata = { title: null, artist: null, cover: null };
        
        try {
            const dataView = new DataView(arrayBuffer);
            
            // Verifica se tem tag ID3v2
            if (dataView.getUint8(0) === 0x49 && 
                dataView.getUint8(1) === 0x44 && 
                dataView.getUint8(2) === 0x33) {
                
                // Tem ID3v2, mas parsing completo é complexo
                // Por simplicidade, usamos apenas o nome do arquivo
            }
        } catch (e) {
            // Ignora erros
        }
        
        resolve(metadata);
    });
}

// ==================== 
// CONTROLES DO PLAYER
// ====================

function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    
    const track = playlist[index];
    currentTrackIndex = index;
    
    // Cria URL do blob
    const url = URL.createObjectURL(track.blob);
    audioElement.src = url;
    
    // Atualiza UI
    updatePlayerUI(track);
    updateMiniPlayerUI(track);
    highlightCurrentInQueue();
    
    // Se estava tocando, continua
    if (isPlaying) {
        audioElement.play();
    }
}

function playTrack() {
    document.getElementById('vinyl-disc')?.classList.add('spinning');
    if (playlist.length === 0) return;
    
    if (currentTrackIndex === -1) {
        currentTrackIndex = 0;
        loadTrack(0);
    }
    
    audioElement.play();
    isPlaying = true;
    updatePlayButtons();
}

function pauseTrack() {
    document.getElementById('vinyl-disc')?.classList.remove('spinning');
    audioElement.pause();
    isPlaying = false;
    updatePlayButtons();
}

function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function nextTrack() {
    if (playlist.length === 0) return;
    
    let nextIndex;
    if (isShuffle) {
        nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
        nextIndex = (currentTrackIndex + 1) % playlist.length;
    }
    
    loadTrack(nextIndex);
    if (isPlaying) audioElement.play();
}

function prevTrack() {
    if (playlist.length === 0) return;
    
    // Se passou mais de 3 segundos, volta pro início da música
    if (audioElement.currentTime > 3) {
        audioElement.currentTime = 0;
        return;
    }
    
    let prevIndex;
    if (isShuffle) {
        prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
        prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    }
    
    loadTrack(prevIndex);
    if (isPlaying) audioElement.play();
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('btn-shuffle');
    if (btn) btn.classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    const btn = document.getElementById('btn-repeat');
    if (btn) btn.classList.toggle('active', isRepeat);
    audioElement.loop = isRepeat;
}

function seekTo(percent) {
    if (audioElement.duration) {
        audioElement.currentTime = audioElement.duration * percent;
    }
}

// ==================== 
// ATUALIZAÇÃO DA UI
// ====================

function updatePlayerUI(track) {
    const titleEl = document.getElementById('music-title');
    const artistEl = document.getElementById('music-artist');
    const coverEl = document.getElementById('music-cover');
    
    if (titleEl) titleEl.textContent = track.name;
    if (artistEl) artistEl.textContent = track.artist;
    
    if (coverEl) {
        if (track.cover) {
            coverEl.innerHTML = `<img src="${track.cover}" alt="Capa">`;
        } else {
            coverEl.innerHTML = '<span class="cover-placeholder">🎵</span>';
        }
    }
}

function updateMiniPlayerUI(track) {
    const titleEl = document.getElementById('mini-title');
    const artistEl = document.getElementById('mini-artist');
    const coverEl = document.getElementById('mini-cover');
    
    if (titleEl) titleEl.textContent = track.name;
    if (artistEl) artistEl.textContent = track.artist;
    
    if (coverEl) {
        if (track.cover) {
            coverEl.innerHTML = `<img src="${track.cover}" alt="Capa">`;
        } else {
            coverEl.innerHTML = '<span>🎵</span>';
        }
    }
}

function updatePlayButtons() {
    const playBtn = document.getElementById('btn-play');
    const miniPlayBtn = document.getElementById('mini-play');
    
    const icon = isPlaying ? '⏸️' : '▶️';
    
    if (playBtn) playBtn.textContent = icon;
    if (miniPlayBtn) miniPlayBtn.textContent = icon;
}

function updateProgress() {
    const current = audioElement.currentTime;
    const duration = audioElement.duration || 0;
    const percent = duration ? (current / duration) * 100 : 0;
    
    const progressBar = document.getElementById('music-progress');
    const handle = document.getElementById('music-progress-handle');
    const currentTime = document.getElementById('music-current');
    const durationEl = document.getElementById('music-duration');
    
    if (progressBar) progressBar.style.width = percent + '%';
    if (handle) handle.style.left = percent + '%';
    if (currentTime) currentTime.textContent = formatTime(current);
    if (durationEl) durationEl.textContent = formatTime(duration);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== 
// FILA DE REPRODUÇÃO
// ====================

function renderQueue() {
    const container = document.getElementById('queue-list');
    if (!container) return;
    
    if (playlist.length === 0) {
        container.innerHTML = '<p class="empty-queue">Nenhuma música na fila</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Mostra apenas 8 inicialmente ou todas se expandido
    const isExpanded = container.classList.contains('queue-expanded');
    const maxVisible = isExpanded ? playlist.length : Math.min(8, playlist.length);
    
    for (let index = 0; index < maxVisible; index++) {
        const track = playlist[index];
        
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.dataset.index = index;
        
        if (index === currentTrackIndex) {
            item.classList.add('playing');
        }
        
        if (selectedForSwap === index) {
            item.classList.add('selected-swap');
        }
        
        item.innerHTML = `
            <div class="queue-item-swap-zone" data-index="${index}">
                <span class="swap-icon">⇅</span>
            </div>
            <div class="queue-item-cover">
                ${track.cover ? `<img src="${track.cover}" alt="Capa">` : '<span>🎵</span>'}
            </div>
            <div class="queue-item-info">
                <div class="queue-item-title">${track.name}</div>
                <div class="queue-item-artist">${track.artist}</div>
            </div>
            <span class="queue-item-duration">${formatTime(track.duration)}</span>
            <button class="queue-item-remove" data-id="${track.id}" title="Remover">✕</button>
        `;
        
        container.appendChild(item);
    }
    
    // Botão mostrar mais / mostrar menos
    if (playlist.length > 8) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'queue-toggle-btn';
        
        if (isExpanded) {
            toggleBtn.innerHTML = '▲ Mostrar menos';
            toggleBtn.addEventListener('click', () => {
                container.classList.remove('queue-expanded');
                renderQueue();
                if (typeof AudioManager !== 'undefined') AudioManager.play('click');
            });
        } else {
            toggleBtn.innerHTML = '▼ Mostrar mais (' + (playlist.length - 8) + ' músicas)';
            toggleBtn.addEventListener('click', () => {
                container.classList.add('queue-expanded');
                renderQueue();
                if (typeof AudioManager !== 'undefined') AudioManager.play('click');
            });
        }
        
        container.appendChild(toggleBtn);
    }
    
    // Event listeners para swap
    container.querySelectorAll('.queue-item-swap-zone').forEach(zone => {
        zone.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(zone.dataset.index);
            handleSwapClick(index);
        });
    });
    
    // Event listeners para tocar
    container.querySelectorAll('.queue-item-info').forEach(info => {
        info.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = info.closest('.queue-item');
            const index = parseInt(item.dataset.index);
            loadTrack(index);
            playTrack();
            showScreen('music-player');
        });
    });
    
    // Event listeners para remover
    container.querySelectorAll('.queue-item-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            await removeTrack(id);
        });
    });
}

function handleSwapClick(index) {
    const items = document.querySelectorAll('.queue-item');
    
    if (selectedForSwap === null) {
        // Primeira seleção
        selectedForSwap = index;
        items[index].classList.add('selected-swap');
        if (typeof AudioManager !== 'undefined') AudioManager.play('click');
    } else if (selectedForSwap === index) {
        // Clicou no mesmo - desseleciona
        selectedForSwap = null;
        items[index].classList.remove('selected-swap');
        if (typeof AudioManager !== 'undefined') AudioManager.play('click');
    } else {
        // Segunda seleção - troca as posições
        swapTracks(selectedForSwap, index);
        selectedForSwap = null;
    }
}

async function swapTracks(index1, index2) {
    // Troca no array
    const temp = playlist[index1];
    playlist[index1] = playlist[index2];
    playlist[index2] = temp;
    
    // Atualiza currentTrackIndex se necessário
    if (currentTrackIndex === index1) {
        currentTrackIndex = index2;
    } else if (currentTrackIndex === index2) {
        currentTrackIndex = index1;
    }
    
    // Salva no IndexedDB
    try {
        const transaction = musicDB.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        
        // Limpa tudo
        await new Promise((resolve, reject) => {
            const req = store.clear();
            req.onsuccess = resolve;
            req.onerror = reject;
        });
        
        // Readiciona na nova ordem
        for (let i = 0; i < playlist.length; i++) {
            const track = playlist[i];
            await new Promise((resolve, reject) => {
                const trackData = {
                    name: track.name,
                    artist: track.artist,
                    cover: track.cover,
                    duration: track.duration,
                    blob: track.blob,
                    type: track.type
                };
                const req = store.add(trackData);
                req.onsuccess = (e) => {
                    playlist[i].id = e.target.result;
                    resolve();
                };
                req.onerror = reject;
            });
        }
    } catch (error) {
        console.error('Erro ao salvar ordem:', error);
    }
    
    if (typeof AudioManager !== 'undefined') AudioManager.play('save');
    renderQueue();
}

function highlightCurrentInQueue() {
    const items = document.querySelectorAll('.queue-item');
    items.forEach((item, index) => {
        item.classList.toggle('playing', index === currentTrackIndex);
    });
}

async function removeTrack(id) {
    const index = playlist.findIndex(t => t.id === id);
    
    if (index === -1) return;
    
    // Se é a música atual, para
    if (index === currentTrackIndex) {
        pauseTrack();
        currentTrackIndex = -1;
    } else if (index < currentTrackIndex) {
        currentTrackIndex--;
    }
    
    playlist.splice(index, 1);
    await deleteTrackFromDB(id);
    renderQueue();
    
    if (playlist.length > 0 && currentTrackIndex === -1) {
        currentTrackIndex = 0;
        loadTrack(0);
    } else if (playlist.length === 0) {
        resetPlayer();
    }
    
    if (typeof AudioManager !== 'undefined') AudioManager.play('click');
}

function resetPlayer() {
    const titleEl = document.getElementById('music-title');
    const artistEl = document.getElementById('music-artist');
    const coverEl = document.getElementById('music-cover');
    
    if (titleEl) titleEl.textContent = 'Nenhuma música';
    if (artistEl) artistEl.textContent = 'Adicione músicas para começar';
    if (coverEl) coverEl.innerHTML = '<span class="cover-placeholder">🎵</span>';
    
    updateMiniPlayerUI({ name: 'Nenhuma música', artist: '', cover: null });
    
    const progressBar = document.getElementById('music-progress');
    const handle = document.getElementById('music-progress-handle');
    if (progressBar) progressBar.style.width = '0%';
    if (handle) handle.style.left = '0%';
}

// ==================== 
// DRAG AND DROP
// ====================

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(e.clientY);
    const container = document.getElementById('queue-list');
    
    if (afterElement == null) {
        container.appendChild(draggedItem);
    } else {
        container.insertBefore(draggedItem, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
}

function handleDragEnd() {
    this.classList.remove('dragging');
    
    // Atualiza a ordem no array e no DB
    const items = document.querySelectorAll('.queue-item');
    const newPlaylist = [];
    
    items.forEach((item, newIndex) => {
        const oldIndex = parseInt(item.dataset.index);
        const track = playlist[oldIndex];
        track.id = undefined; // Remove ID para reatribuir
        newPlaylist.push(track);
        item.dataset.index = newIndex;
        
        // Atualiza índice atual se necessário
        if (oldIndex === currentTrackIndex) {
            currentTrackIndex = newIndex;
        }
    });
    
    playlist = newPlaylist;
    updateTrackOrderInDB(playlist).then(() => {
        loadPlaylist(); // Recarrega para obter novos IDs
    });
    
    highlightCurrentInQueue();
}

function getDragAfterElement(y) {
    const draggableElements = [...document.querySelectorAll('.queue-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ==================== 
// MINI PLAYER
// ====================

function showMiniPlayer() {
    const miniPlayer = document.getElementById('mini-player');
    if (miniPlayer && playlist.length > 0) {
        miniPlayer.classList.add('visible');
        miniPlayer.classList.remove('minimized');
    }
}

function hideMiniPlayer() {
    const miniPlayer = document.getElementById('mini-player');
    if (miniPlayer) {
        miniPlayer.classList.remove('visible');
    }
}

function minimizeMiniPlayer() {
    const miniPlayer = document.getElementById('mini-player');
    if (miniPlayer) {
        miniPlayer.classList.add('minimized');
        pauseTrack();
    }
}

// ==================== 
// EVENTOS DO AUDIO
// ====================

audioElement.addEventListener('timeupdate', updateProgress);

audioElement.addEventListener('ended', () => {
    if (!isRepeat) {
        nextTrack();
    }
});

audioElement.addEventListener('loadedmetadata', () => {
    updateProgress();
});

// ==================== 
// INICIALIZAÇÃO
// ====================

async function initMusicPlayer() {
    try {
        await initMusicDB();
        await loadPlaylist();
        setupMusicPlayerEvents();
        setupProgressBarDrag();
        setupMiniPlayerSwipe();
    } catch (error) {
        console.error('Erro ao inicializar player:', error);
    }
}

function setupMusicPlayerEvents() {
    // Botão play principal
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
        btnPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlay();
        });
    }
    
    // Botões de navegação principal
    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
        btnNext.addEventListener('click', (e) => {
            e.stopPropagation();
            nextTrack();
        });
    }
    
    const btnPrev = document.getElementById('btn-prev');
    if (btnPrev) {
        btnPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            prevTrack();
        });
    }
    
    // Shuffle e Repeat
    const btnShuffle = document.getElementById('btn-shuffle');
    if (btnShuffle) {
        btnShuffle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleShuffle();
        });
    }
    
    const btnRepeat = document.getElementById('btn-repeat');
    if (btnRepeat) {
        btnRepeat.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleRepeat();
        });
    }
    
    // Adicionar música
    const btnAddMusic = document.getElementById('btn-add-music');
    const fileInput = document.getElementById('music-file-input');
    
    if (btnAddMusic && fileInput) {
        btnAddMusic.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                addMusicFiles(e.target.files);
                fileInput.value = '';
            }
        });
    }
    
    // Fila
    const btnQueue = document.getElementById('btn-queue');
    if (btnQueue) {
        btnQueue.addEventListener('click', () => {
            showScreen('music-queue');
        });
    }
    
    // Voltar da fila
    const btnBackQueue = document.getElementById('btn-back-queue');
    if (btnBackQueue) {
        btnBackQueue.addEventListener('click', () => {
            showScreen('music-player');
        });
    }
    
    // ==================
    // MINI PLAYER
    // ==================
    
    // Botão play do mini player
    const miniPlay = document.getElementById('mini-play');
    if (miniPlay) {
        miniPlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
        });
    }
    
    // Botão next do mini player
    const miniNext = document.getElementById('mini-next');
    if (miniNext) {
        miniNext.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nextTrack();
        });
    }
    
    // Botão prev do mini player
    const miniPrev = document.getElementById('mini-prev');
    if (miniPrev) {
        miniPrev.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            prevTrack();
        });
    }
}

function setupProgressBarDrag() {
    const progressBar = document.getElementById('music-progress-bar');
    if (!progressBar) return;
    
    let isDragging = false;
    
    const updateFromPosition = (clientX) => {
        const rect = progressBar.getBoundingClientRect();
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        seekTo(percent);
    };
    
    progressBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateFromPosition(e.clientX);
    });
    
    progressBar.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateFromPosition(e.touches[0].clientX);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) updateFromPosition(e.clientX);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) updateFromPosition(e.touches[0].clientX);
    });
    
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);
}

function setupMiniPlayerSwipe() {
    const miniPlayer = document.getElementById('mini-player');
    if (!miniPlayer) return;
    
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isSwiping = false;
    let hasMoved = false;
    
    miniPlayer.addEventListener('touchstart', (e) => {
        // Ignora se tocou nos botões
        if (e.target.closest('.mini-btn')) {
            isSwiping = false;
            return;
        }
        
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        isSwiping = true;
        hasMoved = false;
    }, { passive: true });
    
    miniPlayer.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        
        const currentX = e.touches[0].clientX;
        const diffX = Math.abs(currentX - startX);
        
        // Só considera swipe se moveu mais de 10px
        if (diffX > 10) {
            hasMoved = true;
            const diff = currentX - startX;
            miniPlayer.style.transform = `translateX(${diff}px)`;
            miniPlayer.style.transition = 'none';
        }
    }, { passive: true });
    
    miniPlayer.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        
        const endX = e.changedTouches[0].clientX;
        const endTime = Date.now();
        const diffX = endX - startX;
        const timeDiff = endTime - startTime;
        
        miniPlayer.style.transition = 'all 0.3s ease';
        miniPlayer.style.transform = '';
        
        // Se não moveu muito e foi rápido, é um clique - abre o player
        if (!hasMoved && timeDiff < 300) {
            // Ignora se clicou nos botões
            if (!e.target.closest('.mini-btn') && !e.target.closest('.mini-player-controls')) {
                showScreen('music-player');
                hideMiniPlayer();
            }
            isSwiping = false;
            return;
        }
        
        // Se moveu, é swipe
        if (hasMoved) {
            if (diffX < -80) {
                // Swipe esquerda - para música e fecha
                pauseTrack();
                hideMiniPlayer();
            } else if (diffX > 80) {
                // Swipe direita - apenas esconde (música continua)
                hideMiniPlayer();
            }
        }
        
        isSwiping = false;
        hasMoved = false;
    }, { passive: true });
}

