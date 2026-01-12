// ShunsKating - Navegação entre telas

// Estado de mudo do app
let appMuted = false;

function loadMuteState() {
    const saved = localStorage.getItem('shunskating-app-muted');
    appMuted = saved === 'true';
    updateMuteButton();
}

function saveMuteState() {
    localStorage.setItem('shunskating-app-muted', appMuted.toString());
}

function updateMuteButton() {
    const btn = document.getElementById('btn-mute-app');
    if (btn) {
        btn.textContent = appMuted ? '🔇' : '🔊';
        btn.classList.toggle('muted', appMuted);
    }
}

function toggleAppMute() {
    appMuted = !appMuted;
    saveMuteState();
    updateMuteButton();
}

// Sistema de Áudio
const AudioManager = {
    sounds: {
        // UI
        click: new Audio('./assets/audio/uiclick.wav'),
        whoosh: new Audio('./assets/audio/smoothwoosh.wav'),
        swipeBack: new Audio('./assets/audio/uiswipeback.wav'),
        filter: new Audio('./assets/audio/uifilteractivatesmoothclick.wav'),
        save: new Audio('./assets/audio/savesucess.wav'),
        
        // Game
        coinFlip: new Audio('./assets/audio/gamecoinflip.wav'),
        yourTurn: new Audio('./assets/audio/gameyourturn.wav'),
        letterGained: new Audio('./assets/audio/gameletternegativegained.wav'),
        victory: new Audio('./assets/audio/victorysound.mp3'),
        defeat: new Audio('./assets/audio/awwdefeatsound.wav'),
        
        // Skate
        pop: new Audio('./assets/audio/skate pop_1.mp3'),
        popFail: new Audio('./assets/audio/skatepopfail_1.mp3'),
        flip: new Audio('./assets/audio/skate som de flip.mp3'),
        treFlip: new Audio('./assets/audio/skate 360 flip_1.mp3'),
        slide: new Audio('./assets/audio/skatesom-slide.mp3'),
        grind: new Audio('./assets/audio/skatesom grindi.mp3'),
        
        // Reações
        celebrate: new Audio('./assets/audio/comemoracaoyeah.wav'),
        frustration: new Audio('./assets/audio/frustration.wav')
    },
    play(soundName) {
        if (appMuted) return;
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Audio play prevented:', e));
        }
    },
    
    // Sequência de sons para suspense do adversário
    async playSkateSequence(landed, trickType) {
        // Som de pop/preparação
        this.play('pop');
        
        // Som específico da manobra
        await this.delay(800);
        if (trickType === 'flatground') {
            this.play('flip');
        } else if (trickType === 'slides') {
            this.play('slide');
        } else if (trickType === 'grinds') {
            this.play('grind');
        }
        
        // Resultado - APENAS UM dos dois
        await this.delay(1000);
        if (landed) {
            this.play('celebrate');
        } else {
            this.play('popFail');
            await this.delay(500);
            this.play('frustration');
        }
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Variável global para categoria selecionada
let selectedCategory = null;
// Histórico de navegação do app
let navigationHistory = ['home'];

// Função para exibir uma tela
function showScreenWithoutHistory(screenId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(screenId);
    if (targetSection) {
        targetSection.classList.add('active');
        AudioManager.play('swipeBack');
    }
}

function showScreen(screenId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(screenId);
    if (targetSection) {
        targetSection.classList.add('active');
        AudioManager.play('whoosh');
        
        // Adiciona ao histórico de navegação
        if (navigationHistory[navigationHistory.length - 1] !== screenId) {
            navigationHistory.push(screenId);
            history.pushState({ screen: screenId }, '', '');
        }
    }
}

// Função genérica para renderizar lista de manobras nas Dicas
function renderDicasTrickList(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !tricksData || !tricksData[category]) return;
    
    container.innerHTML = '';
    
    tricksData[category].forEach(trick => {
        const item = document.createElement('div');
        item.className = 'dicas-trick-item';
        item.dataset.trickId = trick.id;
        
        let dotsHTML = '';
        for (let i = 1; i <= 5; i++) {
            dotsHTML += `<span class="dot ${i <= trick.difficulty ? 'filled' : ''}"></span>`;
        }
        
        item.innerHTML = `
            <span class="dicas-trick-name">${trick.name}</span>
            <div class="dicas-trick-difficulty">${dotsHTML}</div>
        `;
        
        item.addEventListener('click', () => {
            currentCategory = category;
            showTrickDetail(trick.id);
        });
        
        container.appendChild(item);
    });
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Aplicativo iniciado!');
    
    // Carrega os dados das manobras
    console.log('📦 Carregando tricks...');
    await loadTricks();
    console.log('📦 Depois de loadTricks(), tricksData:', tricksData);
    
    // Inicia na tela home
    showScreen('home');

    // Carrega estado de mudo
    loadMuteState();
    
    // Teste de carregamento de imagens (pode remover depois)
    const testImg = new Image();
    testImg.onload = () => console.log('✅ Imagem carregou: splatter_red1.png');
    testImg.onerror = () => console.log('❌ Erro ao carregar: splatter_red1.png');
    testImg.src = './assets/images/splatter_red1.png';

    // Botão de silenciar
    const btnMuteApp = document.getElementById('btn-mute-app');
    if (btnMuteApp) {
        btnMuteApp.addEventListener('click', toggleAppMute);
    }

    // Inicializa player de música
    initMusicPlayer();
    
    // Intercepta o botão voltar do celular/navegador
    window.addEventListener('popstate', (event) => {
        event.preventDefault();
        
        if (navigationHistory.length > 1) {
            navigationHistory.pop(); // Remove tela atual
            const previousScreen = navigationHistory[navigationHistory.length - 1];
            showScreenWithoutHistory(previousScreen);
        }
    });
    
    // Adiciona estado inicial no histórico do navegador
    history.pushState({ screen: 'home' }, '', '');
    
    // Event listeners para botões de categoria
    const categoryButtons = document.querySelectorAll('[data-category]');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            AudioManager.play('click');
            selectedCategory = button.dataset.category;
            showScreen('trick-list');
            initTrickList(selectedCategory);
        });
    });
    
    // Event listeners para filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            AudioManager.play('filter');
            
            // Remove active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona active no clicado
            button.classList.add('active');
            
            // Renderiza com o filtro selecionado
            const filter = button.dataset.filter;
            renderTricks(selectedCategory, filter);
        });
    });
    
    // Event listener para botão voltar do detalhe
    const btnBackDetail = document.querySelector('.detail-header .btn-back');
    if (btnBackDetail) {
        btnBackDetail.addEventListener('click', () => {
            AudioManager.play('swipeBack');
            
            // Categorias que ficam dentro de Dicas
            const dicasCategories = ['manuais', 'late', 'flipinout'];
            
            if (dicasCategories.includes(currentCategory)) {
                showScreen('dicas');
                // Expande a seção correspondente
                const header = document.getElementById(currentCategory + '-header');
                if (header) {
                    const section = header.closest('.dicas-collapsible');
                    const list = document.getElementById(currentCategory + '-list');
                    if (section && list) {
                        section.classList.add('expanded');
                        list.classList.remove('collapsed');
                        list.classList.add('expanded');
                        renderDicasTrickList(currentCategory, currentCategory + '-list');
                    }
                }
            } else {
                showScreen('trick-list');
            }
        });
    }

    // Botões de voltar genéricos
    document.querySelectorAll('.btn-back').forEach(btn => {
        const skipIds = ['btn-back-detail', 'btn-back-stance', 'btn-back-menu', 'btn-back-queue', 'btn-back-metas', 'btn-back-dicas', 'btn-back-game-menu'];
        if (skipIds.includes(btn.id)) return;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const section = btn.closest('section');
            if (!section) return;
            
            const sectionId = section.id;
            
            // Define para onde voltar baseado na tela atual
            let targetScreen = 'home';
            
            if (sectionId === 'trick-detail') {
                targetScreen = 'trick-list';
            } else if (sectionId === 'trick-list') {
                targetScreen = 'home';
            } else if (sectionId === 'music-queue') {
                targetScreen = 'music-player';
            } else if (sectionId === 'metas') {
                targetScreen = 'home';
            } else if (sectionId === 'dicas') {
                targetScreen = 'home';
            } else if (sectionId === 'game') {
                targetScreen = 'home';
            }
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('swipeBack');
            showScreen(targetScreen);
        });
    });

    // Event listener para a barra de progresso
    document.addEventListener('click', (e) => {
        const segment = e.target.closest('.progress-segment');
        if (segment && currentTrick) {
            const progressValue = parseInt(segment.getAttribute('data-progress'));
                saveProgress(currentTrick.id, progressValue);
            updateProgressBar(progressValue);
                AudioManager.play('save');
            }
    });

    // Botão Metas
    const btnMetas = document.getElementById('btn-metas');
    if (btnMetas) {
        btnMetas.addEventListener('click', () => {
            AudioManager.play('click');
            showScreen('metas');
            loadMetas();
        });
    }

    // Botão Dicas
    const btnDicas = document.getElementById('btn-dicas');
    if (btnDicas) {
        btnDicas.addEventListener('click', () => {
            AudioManager.play('click');
            showScreen('dicas');
        });
    }
    
    // Toggle de todas as seções colapsáveis de Dicas
    document.querySelectorAll('.dicas-section-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.dicas-collapsible');
            const listId = header.id.replace('-header', '-list');
            const contentId = header.id.replace('-header', '-content');
            
            let targetElement = document.getElementById(listId) || document.getElementById(contentId);
            
            if (section && targetElement) {
                const isExpanding = !section.classList.contains('expanded');
                
                section.classList.toggle('expanded');
                targetElement.classList.toggle('collapsed');
                targetElement.classList.toggle('expanded');
                
                AudioManager.play('click');
                
                // Se é lista de manobras e está expandindo, renderiza
                if (isExpanding && targetElement.classList.contains('dicas-tricks-list') && targetElement.children.length === 0) {
                    const category = header.id.replace('-header', '');
                    renderDicasTrickList(category, listId);
                }
                
            }
        });
    });

    // Botão voltar Metas
    const btnBackMetas = document.getElementById('btn-back-metas');
    if (btnBackMetas) {
        btnBackMetas.addEventListener('click', () => {
            AudioManager.play('swipeBack');
            showScreen('home');
        });
    }

    // Botão voltar Dicas
    const btnBackDicas = document.getElementById('btn-back-dicas');
    if (btnBackDicas) {
        btnBackDicas.addEventListener('click', () => {
            AudioManager.play('swipeBack');
            showScreen('home');
        });
    }

    // Botões de completar metas
    const btnSemanalConcluir = document.getElementById('btn-semanal-concluir');
    if (btnSemanalConcluir) {
        btnSemanalConcluir.addEventListener('click', () => {
            completarMetaSemanal();
        });
    }

    const btnMensalConcluir = document.getElementById('btn-mensal-concluir');
    if (btnMensalConcluir) {
        btnMensalConcluir.addEventListener('click', () => {
            completarMetaMensal();
        });
    }

    // Botão de favorito
    const btnFavorite = document.getElementById('btn-favorite');
    if (btnFavorite) {
        btnFavorite.addEventListener('click', () => {
            if (currentTrick) {
                toggleFavorite(currentTrick.id);
                updateFavoriteButton();
                AudioManager.play('save');
            }
        });
    }

    // Botão resetar metas
    const btnResetMetas = document.getElementById('btn-reset-metas');
    if (btnResetMetas) {
        btnResetMetas.addEventListener('click', () => {
            if (confirm('Isso vai gerar novas linhas semanal e mensal. Continuar?')) {
                localStorage.removeItem('shunskating-meta-semanal');
                localStorage.removeItem('shunskating-meta-mensal');
                localStorage.removeItem('shunskating-meta-semanal-custom');
                localStorage.removeItem('shunskating-meta-mensal-custom');
                
                AudioManager.play('save');
                loadMetas();
            }
        });
    }

    // Inicializa sistema de destaques
    if (typeof initHighlightSystem === 'function') {
    initHighlightSystem();
    }

    // Configurações das metas
    const configFlipInOutCheck = document.getElementById('config-flip-inout');
    if (configFlipInOutCheck) {
        configFlipInOutCheck.addEventListener('change', (e) => {
            configFlipInOut = e.target.checked;
            saveMetasConfig();
        });
    }

    const configManuaisCheck = document.getElementById('config-manuais');
    if (configManuaisCheck) {
        configManuaisCheck.addEventListener('change', (e) => {
            configManuais = e.target.checked;
            saveMetasConfig();
        });
    }

    // Tabs das metas
    document.querySelectorAll('.meta-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            const parent = tab.closest('.meta-section');
            
            // Remove active de todas as tabs do grupo
            parent.querySelectorAll('.meta-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Esconde todos os conteúdos do grupo
            parent.querySelectorAll('.meta-tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Mostra o conteúdo selecionado
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
            
            AudioManager.play('click');
        });
    });

    // Botões adicionar manobra
    const btnAddSemanal = document.getElementById('btn-add-semanal');
    if (btnAddSemanal) {
        btnAddSemanal.addEventListener('click', () => {
            showAddTrickModal('semanal');
        });
    }

    const btnAddMensal = document.getElementById('btn-add-mensal');
    if (btnAddMensal) {
        btnAddMensal.addEventListener('click', () => {
            showAddTrickModal('mensal');
        });
    }

    // Botões concluir personalizadas
    const btnSemanalCustomConcluir = document.getElementById('btn-semanal-custom-concluir');
    if (btnSemanalCustomConcluir) {
        btnSemanalCustomConcluir.addEventListener('click', () => {
            completarMetaSemanalCustom();
        });
    }

    const btnMensalCustomConcluir = document.getElementById('btn-mensal-custom-concluir');
    if (btnMensalCustomConcluir) {
        btnMensalCustomConcluir.addEventListener('click', () => {
            completarMetaMensalCustom();
        });
    }

    // Event listener para salvar notas pessoais
    const btnSaveNotes = document.getElementById('btn-save-notes');
    if (btnSaveNotes) {
        btnSaveNotes.addEventListener('click', () => {
            const notesTextarea = document.getElementById('personal-notes');
            if (notesTextarea && currentTrick) {
                saveNotes(currentTrick.id, notesTextarea.value);
                AudioManager.play('save');
                
                // Feedback visual
                btnSaveNotes.textContent = 'SALVO!';
                btnSaveNotes.style.background = 'var(--green-glow)';
                setTimeout(() => {
                    btnSaveNotes.textContent = 'SALVAR ANOTAÇÕES';
                    btnSaveNotes.style.background = '';
                }, 1500);
            }
        });
    }

    // Modal de Links
    const modalLink = document.getElementById('modal-link');
    const inputLink = document.getElementById('input-link');
    const inputLinkTitle = document.getElementById('input-link-title');
    const btnAddLink = document.getElementById('btn-add-link');
    const btnCancelLink = document.getElementById('btn-cancel-link');
    const btnSaveLink = document.getElementById('btn-save-link');

    if (btnAddLink && modalLink) {
        btnAddLink.addEventListener('click', () => {
            if (inputLink) inputLink.value = '';
            if (inputLinkTitle) inputLinkTitle.value = '';
            modalLink.classList.add('active');
        });
    }

    if (btnCancelLink && modalLink) {
        btnCancelLink.addEventListener('click', () => {
            modalLink.classList.remove('active');
        });
    }

    if (btnSaveLink && modalLink) {
        btnSaveLink.addEventListener('click', () => {
            if (!currentTrick) return;
            const url = inputLink ? inputLink.value.trim() : '';
            const title = inputLinkTitle ? inputLinkTitle.value.trim() : '';

            if (!url) {
                alert('Cole um link');
                return;
            }

            saveLink(currentTrick.id, url, title);
            renderLinks(currentTrick.id);
            modalLink.classList.remove('active');
        });
    }

    // Modal de Vídeo
    const modalVideo = document.getElementById('modal-video');
    const btnRecordVideo = document.getElementById('btn-record-video');
    const btnCancelVideo = document.getElementById('btn-cancel-video');
    const btnStartRecord = document.getElementById('btn-start-record');
    const btnStopRecord = document.getElementById('btn-stop-record');

    if (btnRecordVideo && modalVideo) {
        btnRecordVideo.addEventListener('click', async () => {
            if (!currentTrick) return;
            modalVideo.classList.add('active');
            const stream = await openCamera();
            if (!stream) {
                modalVideo.classList.remove('active');
            }
        });
    }

    if (btnCancelVideo && modalVideo) {
        btnCancelVideo.addEventListener('click', () => {
            closeCamera();
            modalVideo.classList.remove('active');
            if (btnStartRecord) btnStartRecord.style.display = '';
            if (btnStopRecord) btnStopRecord.style.display = 'none';
        });
    }

    if (btnStartRecord && btnStopRecord) {
        btnStartRecord.addEventListener('click', () => {
            const preview = document.getElementById('video-preview');
            const stream = preview ? preview.srcObject : null;
            if (!stream) return;
            startRecording(stream);
            btnStartRecord.style.display = 'none';
            btnStopRecord.style.display = '';
        });

        btnStopRecord.addEventListener('click', () => {
            stopRecording();
            btnStartRecord.style.display = '';
            btnStopRecord.style.display = 'none';
        });
    }

    // Botão de mudar stance na tela de detalhes
    const btnChangeStance = document.getElementById('btn-change-stance');
    const stanceOptions = document.getElementById('stance-options');

    if (btnChangeStance && stanceOptions) {
        btnChangeStance.addEventListener('click', () => {
            AudioManager.play('click');
            if (stanceOptions.style.display === 'none') {
                stanceOptions.style.display = 'flex';
                btnChangeStance.textContent = 'Mudar base ▲';
            } else {
                stanceOptions.style.display = 'none';
                btnChangeStance.textContent = 'Mudar base ▼';
            }
        });
    }

    // Seleção de stance na tela de detalhes
    document.querySelectorAll('.stance-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const stance = btn.getAttribute('data-stance');
            currentDetailStance = stance;
            AudioManager.play('filter');
            
            // Fecha o menu
            if (stanceOptions) stanceOptions.style.display = 'none';
            if (btnChangeStance) btnChangeStance.textContent = 'Mudar base ▼';
            
            // Atualiza a tela
            updateDetailForStance();
        });
    });
});

// ====================
// SISTEMA DE SWIPE
// ====================

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let currentScreen = 'home';

function setupSwipeNavigation() {
    const homeScreen = document.getElementById('home');
    const playerScreen = document.getElementById('music-player');
    
    if (!homeScreen || !playerScreen) return;
    
    // Swipe na Home
    homeScreen.addEventListener('touchstart', handleTouchStart, { passive: true });
    homeScreen.addEventListener('touchend', handleTouchEndHome, { passive: true });
    
    // Swipe no Player
    playerScreen.addEventListener('touchstart', handleTouchStart, { passive: true });
    playerScreen.addEventListener('touchend', handleTouchEndPlayer, { passive: true });
    
    // Swipe no Game
    const gameScreen = document.getElementById('game-menu');
    if (gameScreen) {
        gameScreen.addEventListener('touchstart', handleTouchStart, { passive: true });
        gameScreen.addEventListener('touchend', handleTouchEndGame, { passive: true });
    }
}

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEndHome(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - e.changedTouches[0].screenY);
    
    // Swipe horizontal (mais de 80px) e não muito vertical
    if (Math.abs(diffX) > 80 && diffY < 100) {
        if (diffX > 0) {
            // Swipe esquerda na Home -> abre Player de música
            openMusicPlayer();
        } else if (diffX < 0) {
            // Swipe direita na Home -> abre Game of S.K.A.T.E.
            openGameScreen();
        }
    }
}

function handleTouchEndPlayer(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - e.changedTouches[0].screenY);
    
    // Swipe horizontal (mais de 80px) e não muito vertical
    if (Math.abs(diffX) > 80 && diffY < 100) {
        if (diffX < 0) {
            // Swipe direita no Player -> volta pra Home
            closeMusicPlayer();
        }
    }
}

function handleTouchEndGame(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = Math.abs(touchStartY - e.changedTouches[0].screenY);
    
    // Swipe horizontal (mais de 80px) e não muito vertical
    if (Math.abs(diffX) > 80 && diffY < 100) {
        if (diffX > 0) {
            // Swipe esquerda (da direita para esquerda) no Game -> volta pra Home
            closeGameScreen();
        }
    }
}

function openMusicPlayer() {
    const homeScreen = document.getElementById('home');
    const playerScreen = document.getElementById('music-player');
    
    if (!homeScreen || !playerScreen) return;
    
    // Animação de saída da Home
    homeScreen.classList.add('slide-out-left');
    
    // Mostra e anima entrada do Player
    playerScreen.classList.add('active', 'slide-in-right');
    
    setTimeout(() => {
        homeScreen.classList.remove('active', 'slide-out-left');
        playerScreen.classList.remove('slide-in-right');
        currentScreen = 'music-player';
        hideMiniPlayer();
    }, 300);
    
    if (typeof AudioManager !== 'undefined') AudioManager.play('click');
}

function closeMusicPlayer() {
    const homeScreen = document.getElementById('home');
    const playerScreen = document.getElementById('music-player');
    
    if (!homeScreen || !playerScreen) return;
    
    // Animação de saída do Player
    playerScreen.classList.add('slide-out-right');
    
    // Mostra e anima entrada da Home
    homeScreen.classList.add('active', 'slide-in-left');
    
    setTimeout(() => {
        playerScreen.classList.remove('active', 'slide-out-right');
        homeScreen.classList.remove('slide-in-left');
        currentScreen = 'home';
        
        // Mostra mini player se tem música
        if (playlist && playlist.length > 0) {
            showMiniPlayer();
        }
    }, 300);
    
    if (typeof AudioManager !== 'undefined') AudioManager.play('swipeBack');
}

function openGameScreen() {
    const homeScreen = document.getElementById('home');
    const gameScreen = document.getElementById('game-menu');
    
    if (!homeScreen || !gameScreen) {
        return;
    }
    
    // Animação de saída da Home
    homeScreen.classList.add('slide-out-right');
    
    // Mostra e anima entrada do Game
    gameScreen.classList.add('active', 'slide-in-left');
    
    setTimeout(() => {
        homeScreen.classList.remove('active', 'slide-out-right');
        gameScreen.classList.remove('slide-in-left');
        currentScreen = 'game-menu';
    }, 300);
    
    if (typeof AudioManager !== 'undefined' && typeof appMuted !== 'undefined' && !appMuted) {
        AudioManager.play('click');
    }
}

function closeGameScreen() {
    const homeScreen = document.getElementById('home');
    const gameScreen = document.getElementById('game-menu');
    
    if (!homeScreen || !gameScreen) {
        return;
    }
    
    // Animação de saída do Game
    gameScreen.classList.add('slide-out-left');
    
    // Mostra e anima entrada da Home
    homeScreen.classList.add('active', 'slide-in-right');
    
    setTimeout(() => {
        gameScreen.classList.remove('active', 'slide-out-left');
        homeScreen.classList.remove('slide-in-right');
        currentScreen = 'home';
    }, 300);
    
    if (typeof AudioManager !== 'undefined' && typeof appMuted !== 'undefined' && !appMuted) {
        AudioManager.play('swipeBack');
    }
}

// Atualiza a função showScreen para lidar com o player
const originalShowScreen = showScreen;
showScreen = function(screenId) {
    // Se está saindo do player pra outra tela, mostra mini player
    if (currentScreen === 'music-player' && screenId !== 'music-player' && screenId !== 'music-queue') {
        if (typeof playlist !== 'undefined' && playlist.length > 0) {
            showMiniPlayer();
        }
    }
    
    // Se está indo pro player, esconde mini player
    if (screenId === 'music-player') {
        hideMiniPlayer();
    }
    
    currentScreen = screenId;
    originalShowScreen(screenId);
};

// Inicializa swipe
document.addEventListener('DOMContentLoaded', () => {
    setupSwipeNavigation();
});

