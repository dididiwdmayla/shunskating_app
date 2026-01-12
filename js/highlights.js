// Sistema de marcação de texto
let currentSelection = null;
let highlightMenu = null;
let currentDicasSection = null; // Para destacar nas seções de Dicas
let highlightSystemInitialized = false; // Flag para evitar múltiplas inicializações

// Carrega destaques salvos
function loadHighlights() {
    const data = localStorage.getItem('shunskating-highlights');
    return data ? JSON.parse(data) : {};
}

// Salva destaques
function saveHighlights(highlights) {
    localStorage.setItem('shunskating-highlights', JSON.stringify(highlights));
}

// Gera chave única para a manobra + stance
function getHighlightKey() {
    if (typeof currentTrick !== 'undefined' && currentTrick && currentTrick.id) {
        const stance = (typeof currentDetailStance !== 'undefined') ? currentDetailStance : 'regular';
        return currentTrick.id + '_' + stance;
    }
    return null;
}

// Aplica destaques salvos ao conteúdo
function applyHighlights() {
    const key = getHighlightKey();
    if (!key) return;
    
    const highlights = loadHighlights();
    const savedHighlights = highlights[key] || [];
    
    const tipsContent = document.getElementById('detail-tips');
    if (!tipsContent) return;
    
    let html = tipsContent.innerHTML;
    
    // Remove destaques existentes primeiro
    html = html.replace(/<span class="user-highlight"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    
    if (savedHighlights.length === 0) {
        tipsContent.innerHTML = html;
        return;
    }
    
    // Aplica destaques (do mais longo pro mais curto)
    const sorted = [...savedHighlights].sort((a, b) => b.text.length - a.text.length);
    
    sorted.forEach(highlight => {
        const text = highlight.text;
        
        // Escapa caracteres especiais de regex
        let escaped = text
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\s+/g, '\\s*');
        
        try {
            // Busca o texto ignorando diferenças de espaço
            const regex = new RegExp('(' + escaped + ')', 'gi');
            html = html.replace(regex, '<span class="user-highlight" data-id="' + highlight.id + '">$1</span>');
        } catch (e) {
            console.log('Regex error:', e);
        }
    });
    
    tipsContent.innerHTML = html;
}

// Salva um novo destaque
function saveNewHighlight(text) {
    const key = getHighlightKey();
    if (!key || !text) return;
    
    // Limpa o texto mas mantém estrutura básica
    let cleanText = text.trim();
    if (cleanText.length < 3) return;
    
    const highlights = loadHighlights();
    if (!highlights[key]) {
        highlights[key] = [];
    }
    
    // Verifica se já existe
    const exists = highlights[key].some(h => h.text === cleanText);
    if (exists) return;
    
    highlights[key].push({
        id: Date.now().toString(),
        text: cleanText
    });
    
    saveHighlights(highlights);
    applyHighlights();
}

// Remove um destaque
function removeHighlight(text) {
    const key = getHighlightKey();
    if (!key) return;
    
    const highlights = loadHighlights();
    if (!highlights[key]) return;
    
    highlights[key] = highlights[key].filter(h => h.text !== text);
    
    if (highlights[key].length === 0) {
        delete highlights[key];
    }
    
    saveHighlights(highlights);
    applyHighlights();
}

// Mostra menu de destaque
function showHighlightMenu(x, y, selectedText, isHighlighted) {
    highlightMenu = document.getElementById('highlight-menu');
    if (!highlightMenu) return;
    
    const markBtn = document.getElementById('highlight-mark');
    const removeBtn = document.getElementById('highlight-remove');
    
    // Mostra/esconde botões baseado no contexto
    if (isHighlighted) {
        markBtn.style.display = 'none';
        removeBtn.style.display = 'block';
    } else {
        markBtn.style.display = 'block';
        removeBtn.style.display = 'none';
    }
    
    // Posiciona o menu
    highlightMenu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
    highlightMenu.style.top = Math.min(y, window.innerHeight - 50) + 'px';
    highlightMenu.classList.add('active');
    
    currentSelection = selectedText;
}

// Esconde menu de destaque
function hideHighlightMenu() {
    if (highlightMenu) {
        highlightMenu.classList.remove('active');
    }
    currentSelection = null;
}

function initHighlightSystem() {
    const tipsContent = document.getElementById('detail-tips');
    
    // Listener para seleção de texto nas dicas de manobras
    // Usa atributo data para verificar se já foi inicializado neste elemento
    if (tipsContent && !tipsContent.dataset.highlightInit) {
        tipsContent.dataset.highlightInit = 'true';
        tipsContent.addEventListener('mouseup', handleTextSelection);
        tipsContent.addEventListener('touchend', handleTextSelection);
    }
    
    // Listener para seleção de texto nas seções de Dicas expandidas
    const dicasContents = document.querySelectorAll('.dicas-text-content');
    dicasContents.forEach(content => {
        if (!content.dataset.highlightInit) {
            content.dataset.highlightInit = 'true';
            content.addEventListener('mouseup', handleTextSelectionDicas);
            content.addEventListener('touchend', handleTextSelectionDicas);
        }
    });
    
    // Botões do menu - só inicializa uma vez
    if (highlightSystemInitialized) return;
    highlightSystemInitialized = true;
    
    // Botões do menu - usar onclick para melhor suporte mobile
    const markBtn = document.getElementById('highlight-mark');
    const removeBtn = document.getElementById('highlight-remove');
    const cancelBtn = document.getElementById('highlight-cancel');
    
    if (markBtn) {
        markBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentSelection && currentDicasSection) {
                saveNewHighlightDicas(currentSelection, currentDicasSection);
                if (typeof AudioManager !== 'undefined') AudioManager.play('save');
            } else if (currentSelection) {
                saveNewHighlight(currentSelection);
                if (typeof AudioManager !== 'undefined') AudioManager.play('save');
            }
            hideHighlightMenu();
            window.getSelection().removeAllRanges();
        };
    }
    
    if (removeBtn) {
        removeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentSelection && currentDicasSection) {
                removeHighlightDicas(currentSelection, currentDicasSection);
                if (typeof AudioManager !== 'undefined') AudioManager.play('click');
            } else if (currentSelection) {
                removeHighlight(currentSelection);
                if (typeof AudioManager !== 'undefined') AudioManager.play('click');
            }
            hideHighlightMenu();
        };
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            hideHighlightMenu();
            window.getSelection().removeAllRanges();
        };
    }
    
    // Fecha menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.highlight-menu') && !e.target.closest('.user-highlight')) {
            const selection = window.getSelection().toString().trim();
            if (!selection) {
                hideHighlightMenu();
            }
        }
    });
}

// Trata seleção de texto nas dicas de manobras (detail-tips)
function handleTextSelection(e) {
    currentDicasSection = null; // Limpa seção de dicas - estamos em manobras
    
    // Delay maior para mobile
    const delay = e.type === 'touchend' ? 300 : 100;
    
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Verifica se clicou num destaque existente
        if (e.target.classList && e.target.classList.contains('user-highlight')) {
            const text = e.target.textContent;
            const rect = e.target.getBoundingClientRect();
            
            // Posição centralizada para mobile
            let x = rect.left;
            let y = rect.bottom + 10;
            if (e.type === 'touchend') {
                x = Math.max(10, (window.innerWidth - 200) / 2);
            }
            
            showHighlightMenu(x, y, text, true);
            return;
        }
        
        // Se tem texto selecionado
        if (selectedText && selectedText.length >= 3) {
            try {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                // Posição centralizada para mobile
                let x = rect.left;
                let y = rect.bottom + 10;
                if (e.type === 'touchend') {
                    x = Math.max(10, (window.innerWidth - 200) / 2);
                }
                
                showHighlightMenu(x, y, selectedText, false);
            } catch (err) {
                console.log('Erro na seleção:', err);
            }
        }
    }, delay);
}

// ==========================================
// SISTEMA DE DESTAQUES PARA SEÇÕES DE DICAS
// ==========================================

// Trata seleção de texto nas seções de Dicas
function handleTextSelectionDicas(e) {
    // Encontra a seção de dicas pai (mesmo se clicou em um highlight dentro)
    let dicasSection = e.target.closest('.dicas-text-content');
    if (!dicasSection) {
        // Tenta encontrar pelo pai do highlight
        const highlight = e.target.closest('.user-highlight');
        if (highlight) {
            dicasSection = highlight.closest('.dicas-text-content');
        }
    }
    if (!dicasSection) return;
    
    const sectionId = dicasSection.id;
    currentDicasSection = sectionId; // IMPORTANTE: Define ANTES do timeout
    
    // Delay maior para mobile
    const delay = e.type === 'touchend' ? 300 : 100;
    
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Verifica se clicou num destaque existente
        if (e.target.classList && e.target.classList.contains('user-highlight')) {
            const text = e.target.textContent;
            const rect = e.target.getBoundingClientRect();
            
            // Posição centralizada para mobile
            let x = rect.left;
            let y = rect.bottom + 10;
            if (e.type === 'touchend') {
                x = Math.max(10, (window.innerWidth - 200) / 2);
            }
            
            // Garante que a seção está definida para remoção
            currentDicasSection = sectionId;
            showHighlightMenu(x, y, text, true);
            return;
        }
        
        // Se tem texto selecionado (mínimo 3 caracteres)
        if (selectedText && selectedText.length >= 3) {
            try {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                // Posição centralizada para mobile
                let x = rect.left;
                let y = rect.bottom + 10;
                if (e.type === 'touchend') {
                    x = Math.max(10, (window.innerWidth - 200) / 2);
                }
                
                showHighlightMenu(x, y, selectedText, false);
            } catch (err) {
                console.log('Erro na seleção:', err);
            }
        }
    }, delay);
}

// Carrega destaques das seções de Dicas
function loadHighlightsDicas() {
    const data = localStorage.getItem('shunskating-dicas-highlights');
    return data ? JSON.parse(data) : {};
}

// Salva destaques das seções de Dicas
function saveHighlightsDicas(highlights) {
    localStorage.setItem('shunskating-dicas-highlights', JSON.stringify(highlights));
}

// Salva um novo destaque na seção de Dicas
function saveNewHighlightDicas(text, sectionId) {
    if (!text || !sectionId) return;
    
    let cleanText = text.trim();
    if (cleanText.length < 3) return;
    
    const highlights = loadHighlightsDicas();
    if (!highlights[sectionId]) {
        highlights[sectionId] = [];
    }
    
    // Verifica se já existe
    const exists = highlights[sectionId].some(h => h.text === cleanText);
    if (exists) return;
    
    highlights[sectionId].push({
        id: Date.now().toString(),
        text: cleanText
    });
    
    saveHighlightsDicas(highlights);
    applyHighlightsDicas(sectionId);
}

// Remove um destaque da seção de Dicas
function removeHighlightDicas(text, sectionId) {
    if (!sectionId) return;
    
    const highlights = loadHighlightsDicas();
    if (!highlights[sectionId]) return;
    
    highlights[sectionId] = highlights[sectionId].filter(h => h.text !== text);
    
    if (highlights[sectionId].length === 0) {
        delete highlights[sectionId];
    }
    
    saveHighlightsDicas(highlights);
    applyHighlightsDicas(sectionId);
}

// Aplica destaques salvos a uma seção de Dicas
function applyHighlightsDicas(sectionId) {
    if (!sectionId) return;
    
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const highlights = loadHighlightsDicas();
    const savedHighlights = highlights[sectionId] || [];
    
    let html = section.innerHTML;
    
    // Remove destaques existentes primeiro
    html = html.replace(/<span class="user-highlight"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    
    if (savedHighlights.length === 0) {
        section.innerHTML = html;
        return;
    }
    
    // Aplica destaques (do mais longo pro mais curto)
    const sorted = [...savedHighlights].sort((a, b) => b.text.length - a.text.length);
    
    sorted.forEach(highlight => {
        const text = highlight.text;
        
        // Escapa caracteres especiais de regex
        let escaped = text
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\s+/g, '\\s*');
        
        try {
            const regex = new RegExp('(' + escaped + ')', 'gi');
            html = html.replace(regex, '<span class="user-highlight" data-id="' + highlight.id + '">$1</span>');
        } catch (e) {
            console.log('Regex error:', e);
        }
    });
    
    section.innerHTML = html;
}

// Aplica destaques em todas as seções de Dicas visíveis
function applyAllDicasHighlights() {
    const sections = document.querySelectorAll('.dicas-text-content');
    sections.forEach(section => {
        if (section.id) {
            applyHighlightsDicas(section.id);
        }
    });
}

