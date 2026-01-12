// ==========================================
// SISTEMA DE DESTAQUE DE TEXTO - v2
// ==========================================

// Cores disponíveis para destaque (ciclo ao segurar)
const highlightColors = ['#ffd700', '#ff4444', '#aa44ff', '#4488ff'];
const highlightColorNames = ['amarelo', 'vermelho', 'roxo', 'azul'];

// Carrega destaques salvos
function getHighlightsKey() {
    // Para manobras
    if (typeof currentTrick !== 'undefined' && currentTrick && currentTrick.id) {
        const stance = (typeof currentDetailStance !== 'undefined') ? currentDetailStance : 'regular';
        return 'hl_' + currentTrick.id + '_' + stance;
    }
    
    // Para seção de dicas
    const dicasScreen = document.getElementById('dicas');
    if (dicasScreen && dicasScreen.classList.contains('active')) {
        // Identifica qual seção está expandida
        const expandedSection = document.querySelector('.dicas-collapsible.expanded');
        if (expandedSection) {
            const header = expandedSection.querySelector('.dicas-section-header');
            if (header && header.id) {
                return 'hl_dicas_' + header.id.replace('-header', '');
            }
        }
        return 'hl_dicas_geral';
    }
    
    return null;
}

function loadHighlights(key) {
    if (!key) return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveHighlights(key, highlights) {
    if (!key) return;
    if (highlights.length === 0) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, JSON.stringify(highlights));
    }
}

// Gera ID único
function generateId() {
    return 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Aplica destaque na seleção atual
function applyHighlightToSelection(colorIndex = 0) {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return false;
    
    const selectedText = selection.toString().trim();
    if (selectedText.length < 2) return false;
    
    const container = getHighlightContainer();
    if (!container) return false;
    
    try {
        const range = selection.getRangeAt(0);
        const hlId = generateId();
        
        // Verifica se a seleção cruza múltiplos elementos block
        const startBlock = getParentBlock(range.startContainer);
        const endBlock = getParentBlock(range.endContainer);
        
        if (startBlock === endBlock) {
            // Seleção dentro do mesmo bloco - método simples
            applySimpleHighlight(range, colorIndex, hlId);
        } else {
            // Seleção cruza múltiplos blocos - método avançado
            applyMultiBlockHighlight(range, colorIndex, hlId, container);
        }
        
        // Limpa seleção
        selection.removeAllRanges();
        
        // Salva
        saveCurrentHighlights();
        
        if (typeof AudioManager !== 'undefined') AudioManager.play('save');
        
        return true;
    } catch (e) {
        console.log('Erro ao aplicar destaque:', e);
        return false;
    }
}

function getParentBlock(node) {
    let current = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    const blockElements = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE'];
    
    while (current && current.parentNode) {
        if (blockElements.includes(current.tagName)) {
            return current;
        }
        current = current.parentNode;
    }
    return current;
}

function applySimpleHighlight(range, colorIndex, hlId) {
    const span = document.createElement('span');
    span.className = 'user-highlight';
    span.dataset.hlId = hlId;
    span.dataset.colorIndex = colorIndex;
    span.style.backgroundColor = highlightColors[colorIndex];
    
    try {
        range.surroundContents(span);
    } catch (e) {
        // Se surroundContents falhar, usa extractContents
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
    }
}

function applyMultiBlockHighlight(range, colorIndex, hlId, container) {
    // Coleta todos os text nodes dentro da seleção
    const textNodes = [];
    const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                const nodeRange = document.createRange();
                nodeRange.selectNodeContents(node);
                
                // Verifica se o node está dentro da seleção
                if (range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
                    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        }
    );
    
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    if (textNodes.length === 0) return;
    
    // Processa cada text node
    textNodes.forEach((textNode, index) => {
        let startOffset = 0;
        let endOffset = textNode.length;
        
        // Primeiro node - usa o offset de início da seleção
        if (index === 0 && textNode === range.startContainer) {
            startOffset = range.startOffset;
        }
        
        // Último node - usa o offset de fim da seleção
        if (index === textNodes.length - 1 && textNode === range.endContainer) {
            endOffset = range.endOffset;
        }
        
        // Se o texto a destacar está vazio, pula
        const textToHighlight = textNode.textContent.substring(startOffset, endOffset);
        if (textToHighlight.trim().length === 0) return;
        
        // Cria o range para este text node
        const nodeRange = document.createRange();
        nodeRange.setStart(textNode, startOffset);
        nodeRange.setEnd(textNode, endOffset);
        
        // Cria e insere o span
        const span = document.createElement('span');
        span.className = 'user-highlight';
        span.dataset.hlId = hlId; // Mesmo ID para todos os spans do mesmo highlight
        span.dataset.colorIndex = colorIndex;
        span.style.backgroundColor = highlightColors[colorIndex];
        
        try {
            nodeRange.surroundContents(span);
        } catch (e) {
            // Fallback
            const fragment = nodeRange.extractContents();
            span.appendChild(fragment);
            nodeRange.insertNode(span);
        }
    });
}

// Muda cor do destaque (cicla entre as cores)
function cycleHighlightColor(element) {
    if (!element) return;
    
    let colorIndex = parseInt(element.dataset.colorIndex || '0');
    colorIndex = (colorIndex + 1) % highlightColors.length;
    
    const hlId = element.dataset.hlId;
    
    // Atualiza TODOS os spans com o mesmo ID (para highlights multi-bloco)
    const container = getHighlightContainer();
    if (container) {
        container.querySelectorAll(`.user-highlight[data-hl-id="${hlId}"]`).forEach(span => {
            span.dataset.colorIndex = colorIndex;
            span.style.backgroundColor = highlightColors[colorIndex];
        });
    } else {
        // Fallback - atualiza só o elemento clicado
        element.dataset.colorIndex = colorIndex;
        element.style.backgroundColor = highlightColors[colorIndex];
    }
    
    saveCurrentHighlights();
    
    if (typeof AudioManager !== 'undefined') AudioManager.play('click');
}

// Remove destaque
function removeHighlight(element) {
    if (!element || !element.classList.contains('user-highlight')) return;
    
    const hlId = element.dataset.hlId;
    const container = getHighlightContainer();
    
    // Remove TODOS os spans com o mesmo ID (para highlights multi-bloco)
    const spansToRemove = container ? 
        container.querySelectorAll(`.user-highlight[data-hl-id="${hlId}"]`) : 
        [element];
    
    spansToRemove.forEach(span => {
        const parent = span.parentNode;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
    });
    
    // Normaliza o DOM
    if (container) container.normalize();
    
    saveCurrentHighlights();
    
    if (typeof AudioManager !== 'undefined') AudioManager.play('click');
}

// Salva todos os destaques atuais da tela
function saveCurrentHighlights() {
    const key = getHighlightsKey();
    if (!key) return;
    
    const highlights = [];
    const container = getHighlightContainer();
    if (!container) return;
    
    // Agrupa spans pelo ID (highlights multi-bloco têm mesmo ID)
    const hlGroups = {};
    
    container.querySelectorAll('.user-highlight').forEach(el => {
        const hlId = el.dataset.hlId || generateId();
        
        if (!hlGroups[hlId]) {
            hlGroups[hlId] = {
                id: hlId,
                colorIndex: parseInt(el.dataset.colorIndex || '0'),
                parts: []
            };
        }
        
        hlGroups[hlId].parts.push(el.textContent);
    });
    
    // Converte para array
    for (const hlId in hlGroups) {
        const group = hlGroups[hlId];
        highlights.push({
            id: group.id,
            text: group.parts.join(' '), // Junta todas as partes
            colorIndex: group.colorIndex
        });
    }
    
    saveHighlights(key, highlights);
}

// Obtém o container de highlights atual
function getHighlightContainer() {
    // Primeiro tenta dicas da manobra
    const tipsContent = document.getElementById('detail-tips');
    if (tipsContent && tipsContent.offsetParent !== null) {
        return tipsContent;
    }
    
    // Depois tenta seção de dicas expandida
    const expandedContent = document.querySelector('.dicas-text-content.expanded');
    if (expandedContent) {
        return expandedContent;
    }
    
    return null;
}

// Gera caminho do elemento para restauração
function getElementPath(el, container) {
    const path = [];
    let current = el.parentNode;
    
    while (current && current !== container) {
        const parent = current.parentNode;
        if (parent) {
            const index = Array.from(parent.children).indexOf(current);
            path.unshift(index);
        }
        current = parent;
    }
    
    return path;
}

// Restaura destaques salvos
function restoreHighlights() {
    const key = getHighlightsKey();
    if (!key) return;
    
    const container = getHighlightContainer();
    if (!container) return;
    
    const highlights = loadHighlights(key);
    if (highlights.length === 0) return;
    
    // Remove highlights existentes primeiro
    container.querySelectorAll('.user-highlight').forEach(el => {
        const parent = el.parentNode;
        while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    });
    container.normalize();
    
    // Restaura cada highlight
    highlights.forEach(hl => {
        try {
            const searchText = hl.text;
            const found = findAndHighlightText(container, searchText, hl.colorIndex, hl.id, hl.html);
            if (!found) {
                console.log('Não encontrou texto para restaurar:', searchText.substring(0, 30));
            }
        } catch (e) {
            console.log('Erro ao restaurar highlight:', e);
        }
    });
}

function findAndHighlightText(container, searchText, colorIndex, id, originalHtml) {
    // Busca o texto no container usando TreeWalker
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    let fullText = '';
    const nodes = [];
    
    // Coleta todos os text nodes
    while (node = walker.nextNode()) {
        nodes.push({
            node: node,
            start: fullText.length,
            end: fullText.length + node.textContent.length
        });
        fullText += node.textContent;
    }
    
    // Procura o texto (ignorando múltiplos espaços/quebras)
    const normalizedSearch = searchText.replace(/\s+/g, ' ').trim();
    const normalizedFull = fullText.replace(/\s+/g, ' ');
    
    let searchIndex = normalizedFull.indexOf(normalizedSearch);
    if (searchIndex === -1) return false;
    
    // Mapeia de volta para a posição original
    let originalIndex = 0;
    let normalizedIndex = 0;
    
    while (normalizedIndex < searchIndex) {
        if (/\s/.test(fullText[originalIndex])) {
            // Pula espaços extras no original
            while (originalIndex < fullText.length && /\s/.test(fullText[originalIndex])) {
                originalIndex++;
            }
            normalizedIndex++;
        } else {
            originalIndex++;
            normalizedIndex++;
        }
    }
    
    const startPos = originalIndex;
    const endPos = startPos + searchText.length;
    
    // Encontra os nodes que contêm o texto
    let startNode = null, endNode = null;
    let startOffset = 0, endOffset = 0;
    
    for (const n of nodes) {
        if (!startNode && n.end > startPos) {
            startNode = n.node;
            startOffset = startPos - n.start;
        }
        if (n.end >= endPos) {
            endNode = n.node;
            endOffset = endPos - n.start;
            break;
        }
    }
    
    if (!startNode || !endNode) return false;
    
    try {
        const range = document.createRange();
        range.setStart(startNode, Math.min(startOffset, startNode.length));
        range.setEnd(endNode, Math.min(endOffset, endNode.length));
        
        const span = document.createElement('span');
        span.className = 'user-highlight';
        span.dataset.hlId = id;
        span.dataset.colorIndex = colorIndex;
        span.style.backgroundColor = highlightColors[colorIndex];
        
        const fragment = range.cloneContents();
        span.appendChild(fragment);
        range.deleteContents();
        range.insertNode(span);
        
        return true;
    } catch (e) {
        console.log('Erro ao criar range:', e);
        return false;
    }
}

// Obtém todos os nós de texto de um elemento
function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.trim().length > 0) {
            textNodes.push(node);
        }
    }
    
    return textNodes;
}

// ==========================================
// MENU DE DESTAQUE
// ==========================================

let highlightMenu = null;
let currentHighlightElement = null;

function createHighlightMenu() {
    if (document.getElementById('highlight-menu')) return;
    
    const menu = document.createElement('div');
    menu.id = 'highlight-menu';
    menu.className = 'highlight-menu';
    menu.innerHTML = `
        <button class="hl-btn hl-btn-mark" id="hl-mark">✨ Destacar</button>
        <div class="hl-btn-group">
            <button class="hl-btn hl-btn-color" id="hl-color">🎨</button>
            <button class="hl-btn hl-btn-remove" id="hl-remove">🗑️</button>
        </div>
    `;
    document.body.appendChild(menu);
    
    highlightMenu = menu;
    
    // Event listeners dos botões
    document.getElementById('hl-mark').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        applyHighlightToSelection(0);
        hideHighlightMenu();
    };
    
    document.getElementById('hl-color').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentHighlightElement) {
            cycleHighlightColor(currentHighlightElement);
        }
        // Não esconde o menu, permite trocar várias vezes
    };
    
    document.getElementById('hl-remove').onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentHighlightElement) {
            removeHighlight(currentHighlightElement);
            currentHighlightElement = null;
        }
        hideHighlightMenu();
    };
}

function showHighlightMenu(x, y, isExistingHighlight = false) {
    if (!highlightMenu) createHighlightMenu();
    
    const markBtn = document.getElementById('hl-mark');
    const btnGroup = document.querySelector('.hl-btn-group');
    
    if (isExistingHighlight) {
        markBtn.style.display = 'none';
        btnGroup.style.display = 'flex';
    } else {
        markBtn.style.display = 'block';
        btnGroup.style.display = 'none';
    }
    
    // Posiciona o menu
    const menuWidth = 130;
    let posX = Math.min(x, window.innerWidth - menuWidth - 10);
    let posY = y + 10;
    
    if (posY + 50 > window.innerHeight) {
        posY = y - 60;
    }
    
    highlightMenu.style.left = Math.max(10, posX) + 'px';
    highlightMenu.style.top = posY + 'px';
    highlightMenu.classList.add('active');
}

function hideHighlightMenu() {
    if (highlightMenu) {
        highlightMenu.classList.remove('active');
    }
    currentHighlightElement = null;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function initHighlightSystem() {
    createHighlightMenu();
    
    // Detecta seleção de texto (mouseup e touchend)
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);
    
    // Detecta clique em highlight existente
    document.addEventListener('click', handleHighlightClick);
    
    // Fecha menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.highlight-menu') && 
            !e.target.closest('.user-highlight')) {
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.isCollapsed) {
                    hideHighlightMenu();
                }
            }, 10);
        }
    });
    
    // Fecha menu ao scroll
    document.addEventListener('scroll', hideHighlightMenu, true);
}

function handleSelectionEnd(e) {
    // Ignora se clicou no menu
    if (e.target.closest('.highlight-menu')) return;
    
    // Ignora se clicou em highlight existente
    if (e.target.closest('.user-highlight')) return;
    
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // Verifica se está em área permitida
        const container = getHighlightContainer();
        if (!container) return;
        
        if (!selection.anchorNode || !container.contains(selection.anchorNode)) return;
        
        if (selectedText.length >= 2) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            showHighlightMenu(rect.left, rect.bottom, false);
        }
    }, 10);
}

function handleHighlightClick(e) {
    const highlight = e.target.closest('.user-highlight');
    if (highlight) {
        e.preventDefault();
        e.stopPropagation();
        currentHighlightElement = highlight;
        const rect = highlight.getBoundingClientRect();
        showHighlightMenu(rect.left, rect.bottom, true);
    }
}
