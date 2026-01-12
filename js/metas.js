// Carrega linha personalizada semanal
function loadMetaSemanalCustom() {
    const weekStart = getWeekStart();
    const saved = localStorage.getItem('shunskating-meta-semanal-custom');
    
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.weekStart === weekStart) {
            return parsed;
        }
    }
    
    return {
        weekStart: weekStart,
        linha: [],
        completed: false
    };
}

// Carrega linha personalizada mensal
function loadMetaMensalCustom() {
    const monthStart = getMonthStart();
    const saved = localStorage.getItem('shunskating-meta-mensal-custom');
    
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.monthStart === monthStart) {
            return parsed;
        }
    }
    
    return {
        monthStart: monthStart,
        linha: [],
        completed: false
    };
}

// Salva linha personalizada
function saveMetaSemanalCustom() {
    localStorage.setItem('shunskating-meta-semanal-custom', JSON.stringify(metaSemanalCustom));
}

function saveMetaMensalCustom() {
    localStorage.setItem('shunskating-meta-mensal-custom', JSON.stringify(metaMensalCustom));
}

// Renderiza linha personalizada semanal
function renderMetaSemanalCustom() {
    const container = document.getElementById('meta-semanal-custom-linha');
    const btn = document.getElementById('btn-semanal-custom-concluir');
    const addBtn = document.getElementById('btn-add-semanal');
    if (!container) return;
    
    container.innerHTML = '';
    
    metaSemanalCustom.linha.forEach((trick, index) => {
        const span = document.createElement('span');
        span.className = 'linha-trick-custom';
        span.innerHTML = `
            ${trick}
            <button class="linha-trick-remove" data-index="${index}">×</button>
        `;
        container.appendChild(span);
        
        if (index < metaSemanalCustom.linha.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'linha-arrow';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }
    });
    
    // Event listeners para remover
    container.querySelectorAll('.linha-trick-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute('data-index'));
            metaSemanalCustom.linha.splice(index, 1);
            saveMetaSemanalCustom();
            renderMetaSemanalCustom();
            AudioManager.play('click');
        });
    });
    
    // Esconde botão adicionar se já tem 4
    if (addBtn) {
        addBtn.style.display = metaSemanalCustom.linha.length >= 4 ? 'none' : 'block';
    }
    
    // Botão concluir
    if (btn) {
        if (metaSemanalCustom.completed) {
            btn.textContent = 'CONCLUÍDA! ✓';
            btn.classList.add('completed');
            btn.disabled = true;
        } else if (metaSemanalCustom.linha.length < 3) {
            btn.textContent = 'MÍNIMO 3 MANOBRAS';
            btn.disabled = true;
            btn.classList.remove('completed');
        } else {
            btn.textContent = 'COMPLETEI A LINHA!';
            btn.classList.remove('completed');
            btn.disabled = false;
        }
    }
}

// Renderiza linha personalizada mensal
function renderMetaMensalCustom() {
    const container = document.getElementById('meta-mensal-custom-linha');
    const btn = document.getElementById('btn-mensal-custom-concluir');
    const addBtn = document.getElementById('btn-add-mensal');
    if (!container) return;
    
    container.innerHTML = '';
    
    metaMensalCustom.linha.forEach((trick, index) => {
        const span = document.createElement('span');
        span.className = 'linha-trick-custom';
        span.innerHTML = `
            ${trick}
            <button class="linha-trick-remove" data-index="${index}">×</button>
        `;
        container.appendChild(span);
        
        if (index < metaMensalCustom.linha.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'linha-arrow';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }
    });
    
    // Event listeners para remover
    container.querySelectorAll('.linha-trick-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute('data-index'));
            metaMensalCustom.linha.splice(index, 1);
            saveMetaMensalCustom();
            renderMetaMensalCustom();
            AudioManager.play('click');
        });
    });
    
    // Esconde botão adicionar se já tem 7
    if (addBtn) {
        addBtn.style.display = metaMensalCustom.linha.length >= 7 ? 'none' : 'block';
    }
    
    // Botão concluir
    if (btn) {
        if (metaMensalCustom.completed) {
            btn.textContent = 'CONCLUÍDA! ✓';
            btn.classList.add('completed');
            btn.disabled = true;
        } else if (metaMensalCustom.linha.length < 5) {
            btn.textContent = 'MÍNIMO 5 MANOBRAS';
            btn.disabled = true;
            btn.classList.remove('completed');
        } else {
            btn.textContent = 'COMPLETEI A LINHA!';
            btn.classList.remove('completed');
            btn.disabled = false;
        }
    }
}

// Completar linhas personalizadas
function completarMetaSemanalCustom() {
    if (!metaSemanalCustom || metaSemanalCustom.completed || metaSemanalCustom.linha.length < 3) return;
    metaSemanalCustom.completed = true;
    saveMetaSemanalCustom();
    AudioManager.play('celebrate');
    renderMetaSemanalCustom();
}

function completarMetaMensalCustom() {
    if (!metaMensalCustom || metaMensalCustom.completed || metaMensalCustom.linha.length < 5) return;
    metaMensalCustom.completed = true;
    saveMetaMensalCustom();
    AudioManager.play('celebrate');
    renderMetaMensalCustom();
}

// Adiciona manobra à linha personalizada
function showAddTrickModal(type) {
    // Cria modal de seleção
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'modal-add-trick';
    
    const categories = ['flatground', 'slides', 'grinds', 'manuais'];
    let categoriesHTML = '';
    
    categories.forEach(cat => {
        if (!tricksData || !tricksData[cat]) return;
        
        const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
        let tricksHTML = '';
        
        tricksData[cat].forEach(trick => {
            tricksHTML += `<button class="modal-trick-btn" data-trick="${trick.name}">${trick.name}</button>`;
        });
        
        categoriesHTML += `
            <div class="modal-category">
                <h4>${catLabel}</h4>
                <div class="modal-tricks-grid">${tricksHTML}</div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content modal-add-trick-content">
            <h3>Adicionar manobra</h3>
            <div class="modal-categories-scroll">
                ${categoriesHTML}
            </div>
            <button class="btn-secondary modal-close">Cancelar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelectorAll('.modal-trick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const trickName = btn.getAttribute('data-trick');
            
            if (type === 'semanal') {
                metaSemanalCustom.linha.push(trickName);
                saveMetaSemanalCustom();
                renderMetaSemanalCustom();
            } else {
                metaMensalCustom.linha.push(trickName);
                saveMetaMensalCustom();
                renderMetaMensalCustom();
            }
            
            AudioManager.play('save');
            modal.remove();
        });
    });
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}
// Variáveis das metas
let metasDiarias = null;
let metaSemanal = null;
let metaMensal = null;
let metaSemanalCustom = null;
let metaMensalCustom = null;

// Obstáculos disponíveis
const obstaculosDisponiveis = [
    { id: 'manual-pad', name: 'Manual pad', icon: '📏' },
    { id: 'borda', name: 'Borda', icon: '🟫' },
    { id: 'corriborda', name: 'Corriborda', icon: '🛤️' },
    { id: 'corrimao', name: 'Corrimão', icon: '🚧' }
];

// Configuração de quais obstáculos a pista tem
let obstaculosPista = ['manual-pad', 'borda'];

// Flips disponíveis para in/out
const flipsInOut = ['Kickflip', 'Heelflip', 'Shove-it'];

// Variáveis para controle da troca
let trocaAtual = {
    tipo: null, // 'semanal' ou 'mensal'
    index: null
};

// Configurações
let configFlipInOut = false;
let configManuais = true;

// Carrega configurações do localStorage
function loadMetasConfig() {
    const config = localStorage.getItem('shunskating-metas-config');
    if (config) {
        const parsed = JSON.parse(config);
        configFlipInOut = parsed.flipInOut || false;
        configManuais = parsed.manuais !== false;
    }
    
    // Atualiza checkboxes
    const flipCheck = document.getElementById('config-flip-inout');
    const manuaisCheck = document.getElementById('config-manuais');
    if (flipCheck) flipCheck.checked = configFlipInOut;
    if (manuaisCheck) manuaisCheck.checked = configManuais;
}

// Salva configurações
function saveMetasConfig() {
    const config = {
        flipInOut: configFlipInOut,
        manuais: configManuais
    };
    localStorage.setItem('shunskating-metas-config', JSON.stringify(config));
}

function loadObstaculosConfig() {
    const saved = localStorage.getItem('shunskating-obstaculos-pista');
    if (saved) {
        obstaculosPista = JSON.parse(saved);
    }
    renderObstaculosConfig();
}

function saveObstaculosConfig() {
    localStorage.setItem('shunskating-obstaculos-pista', JSON.stringify(obstaculosPista));
}

function renderObstaculosConfig() {
    const container = document.getElementById('obstaculos-config-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    obstaculosDisponiveis.forEach(obs => {
        const label = document.createElement('label');
        label.className = 'config-toggle';
        label.innerHTML = `
            <input type="checkbox" data-obstaculo="${obs.id}" ${obstaculosPista.includes(obs.id) ? 'checked' : ''}>
            <span class="toggle-label">${obs.icon} ${obs.name}</span>
        `;
        container.appendChild(label);
    });
    
    // Event listeners
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const obsId = e.target.getAttribute('data-obstaculo');
            if (e.target.checked) {
                if (!obstaculosPista.includes(obsId)) {
                    obstaculosPista.push(obsId);
                }
            } else {
                obstaculosPista = obstaculosPista.filter(o => o !== obsId);
                // Chão sempre fica
                if (!obstaculosPista.includes('chao')) {
                    obstaculosPista.push('chao');
                    e.target.checked = true;
                }
            }
            saveObstaculosConfig();
        });
    });
}

// Obtém manobras elegíveis (nível 2, 3 ou 4)
function getEligibleTricks(category, minLevel = 2) {
    if (!tricksData || !tricksData[category]) return [];
    
    const progress = JSON.parse(localStorage.getItem('shunskating-progress') || '{}');
    
    return tricksData[category].filter(trick => {
        // Verifica todas as stances
        const stances = ['regular', 'fakie', 'nollie', 'switch'];
        for (const stance of stances) {
            const key = trick.id + '_' + stance;
            const level = progress[key] || 0;
            if (level >= minLevel && level <= 4) {
                return true;
            }
        }
        return false;
    });
}

// Obtém manobras elegíveis para linhas (nível 3+)
function getEligibleForLines(category) {
    if (!tricksData || !tricksData[category]) return [];
    
    const progress = JSON.parse(localStorage.getItem('shunskating-progress') || '{}');
    
    return tricksData[category].filter(trick => {
        const stances = ['regular', 'fakie', 'nollie', 'switch'];
        for (const stance of stances) {
            const key = trick.id + '_' + stance;
            const level = progress[key] || 0;
            if (level >= 3) {
                return true;
            }
        }
        return false;
    });
}

// Sorteia uma manobra aleatória de uma categoria
function getRandomTrick(category, minLevel = 2) {
    const eligible = getEligibleTricks(category, minLevel);
    if (eligible.length === 0) {
        // Se não tem elegíveis, pega qualquer uma fácil
        const allTricks = tricksData[category] || [];
        const easy = allTricks.filter(t => t.difficulty <= 2);
        if (easy.length > 0) {
            return easy[Math.floor(Math.random() * easy.length)];
        }
        return allTricks[0] || null;
    }
    return eligible[Math.floor(Math.random() * eligible.length)];
}

// Gera as metas diárias
function generateMetasDiarias() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('shunskating-metas-diarias');
    
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
            return parsed;
        }
    }
    
    // Gera novas metas
    const flatground = getRandomTrick('flatground');
    const slide = getRandomTrick('slides');
    const grind = getRandomTrick('grinds');
    
    const metas = {
        date: today,
        items: [
            { category: 'flatground', trick: flatground, completed: false },
            { category: 'slides', trick: slide, completed: false },
            { category: 'grinds', trick: grind, completed: false }
        ]
    };
    
    localStorage.setItem('shunskating-metas-diarias', JSON.stringify(metas));
    return metas;
}

// Gera linha semanal (3-4 manobras)
function generateMetaSemanal() {
    const weekStart = getWeekStart();
    const saved = localStorage.getItem('shunskating-meta-semanal');
    
    if (saved) {
        const parsed = JSON.parse(saved);
        // Verifica se é da semana atual E se tem a estrutura nova
        if (parsed.weekStart === weekStart && parsed.linha && parsed.linha[0] && parsed.linha[0].numero) {
            return parsed;
        }
    }
    
    // Gera nova linha
    const linha = generateLinha(4, 5);
    
    const meta = {
        weekStart: weekStart,
        linha: linha,
        completed: false
    };
    
    localStorage.setItem('shunskating-meta-semanal', JSON.stringify(meta));
    return meta;
}

// Gera linha mensal (5-7 manobras)
function generateMetaMensal() {
    const monthStart = getMonthStart();
    const saved = localStorage.getItem('shunskating-meta-mensal');
    
    if (saved) {
        const parsed = JSON.parse(saved);
        // Verifica se é do mês atual E se tem a estrutura nova
        if (parsed.monthStart === monthStart && parsed.linha && parsed.linha[0] && parsed.linha[0].numero) {
            return parsed;
        }
    }
    
    // Gera nova linha
    const linha = generateLinha(7, 9);
    
    const meta = {
        monthStart: monthStart,
        linha: linha,
        completed: false
    };
    
    localStorage.setItem('shunskating-meta-mensal', JSON.stringify(meta));
    return meta;
}

// Gera uma linha de manobras em formato de tabela
function generateLinha(minSize, maxSize) {
    const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const linha = [];
    const usedTricks = new Set();
    
    for (let i = 0; i < size; i++) {
        const item = {
            numero: i + 1,
            local: '',
            manobra: '',
            entrada: '',
            saida: ''
        };
        
        // Escolhe obstáculo
        if (i === 0 || i === size - 1) {
            // Começa e termina no chão
            item.local = 'Chão';
            item.manobra = getRandomTrickForLocal('chao', usedTricks);
        } else {
            // Meio pode ser qualquer obstáculo disponível
            const localId = obstaculosPista[Math.floor(Math.random() * obstaculosPista.length)];
            const localObj = obstaculosDisponiveis.find(o => o.id === localId);
            item.local = localObj ? localObj.name : 'Chão';
            item.manobra = getRandomTrickForLocal(localId, usedTricks);
            
            // Flip in/out para bordas e corrimão
            if (['borda', 'corriborda', 'corrimao'].includes(localId) && configFlipInOut) {
                if (Math.random() < 0.3) {
                    item.entrada = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' in';
                }
                if (Math.random() < 0.3) {
                    item.saida = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' out';
                }
            }
        }
        
        if (item.manobra) {
            usedTricks.add(item.manobra);
            linha.push(item);
        }
    }
    
    return linha;
}

// Obtém início da semana (segunda-feira)
function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toDateString();
}

// Obtém início do mês
function getMonthStart() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

// Carrega e exibe todas as metas
function loadMetas() {
    loadMetasConfig();
    loadObstaculosConfig();
    
    // Meta diária
    metasDiarias = generateMetasDiarias();
    renderMetasDiarias();
    
    // Meta semanal
    metaSemanal = generateMetaSemanal();
    renderMetaSemanal();
    
    // Meta semanal personalizada
    metaSemanalCustom = loadMetaSemanalCustom();
    renderMetaSemanalCustom();
    
    // Meta mensal
    metaMensal = generateMetaMensal();
    renderMetaMensal();
    
    // Meta mensal personalizada
    metaMensalCustom = loadMetaMensalCustom();
    renderMetaMensalCustom();
}

// Renderiza metas diárias
function renderMetasDiarias() {
    const container = document.getElementById('meta-diaria-items');
    if (!container || !metasDiarias) return;
    
    container.innerHTML = '';
    
    metasDiarias.items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'meta-item';
        
        const categoryLabels = {
            flatground: 'Flatground',
            slides: 'Slide',
            grinds: 'Grind'
        };
        
        div.innerHTML = `
            <div class="meta-checkbox ${item.completed ? 'checked' : ''}" data-index="${index}"></div>
            <div class="meta-item-info">
                <div class="meta-item-category">${categoryLabels[item.category]}</div>
                <div class="meta-item-name">${item.trick ? item.trick.name : 'Nenhuma disponível'}</div>
            </div>
        `;
        
        container.appendChild(div);
    });
    
    // Event listeners para checkboxes
    container.querySelectorAll('.meta-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', () => {
            const index = parseInt(checkbox.getAttribute('data-index'));
            toggleMetaDiaria(index);
        });
    });
}

// Renderiza meta semanal
function renderMetaSemanal() {
    const container = document.getElementById('meta-semanal-linha');
    const btn = document.getElementById('btn-semanal-concluir');
    if (!container || !metaSemanal) return;
    
    container.innerHTML = '';
    
    metaSemanal.linha.forEach((trick, index) => {
        const span = document.createElement('span');
        span.className = 'linha-trick';
        span.textContent = trick;
        container.appendChild(span);
        
        if (index < metaSemanal.linha.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'linha-arrow';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }
    });
    
    if (btn) {
        if (metaSemanal.completed) {
            btn.textContent = 'CONCLUÍDA! ✓';
            btn.classList.add('completed');
            btn.disabled = true;
        } else {
            btn.textContent = 'COMPLETEI A LINHA!';
            btn.classList.remove('completed');
            btn.disabled = false;
        }
    }
}

// Renderiza meta mensal
function renderMetaMensal() {
    const container = document.getElementById('meta-mensal-linha');
    const btn = document.getElementById('btn-mensal-concluir');
    if (!container || !metaMensal) return;
    
    container.innerHTML = '';
    
    metaMensal.linha.forEach((trick, index) => {
        const span = document.createElement('span');
        span.className = 'linha-trick';
        span.textContent = trick;
        container.appendChild(span);
        
        if (index < metaMensal.linha.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'linha-arrow';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }
    });
    
    if (btn) {
        if (metaMensal.completed) {
            btn.textContent = 'CONCLUÍDA! ✓';
            btn.classList.add('completed');
            btn.disabled = true;
        } else {
            btn.textContent = 'COMPLETEI A LINHA!';
            btn.classList.remove('completed');
            btn.disabled = false;
        }
    }
}

// NOVO: renderização em tabela para meta semanal
function renderMetaSemanal() {
    const container = document.getElementById('meta-semanal-linha');
    const btn = document.getElementById('btn-semanal-concluir');
    if (!container || !metaSemanal) return;
    
    container.innerHTML = '';
    container.className = 'linha-table';
    
    metaSemanal.linha.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'linha-table-item';
        
        // Só permite trocar se não estiver concluída
        if (!metaSemanal.completed) {
            div.addEventListener('click', () => {
                abrirModalTroca('semanal', index);
            });
        } else {
            div.style.cursor = 'default';
        }
        
        let manobraHTML = '';
        if (item.entrada) {
            manobraHTML += `<span class="entrada">${item.entrada}</span>`;
        }
        manobraHTML += `<span class="trick-principal">${item.manobra}</span>`;
        if (item.saida) {
            manobraHTML += `<span class="saida">${item.saida}</span>`;
        }
        
        div.innerHTML = `
            <div class="linha-table-row row-numero">${item.numero}ª</div>
            <div class="linha-table-row row-local">${item.local}</div>
            <div class="linha-table-row row-manobra">${manobraHTML}</div>
        `;
        
        container.appendChild(div);
        
        if (index < metaSemanal.linha.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'linha-table-arrow';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }
    });
    
    if (btn) {
        if (metaSemanal.completed) {
            btn.textContent = 'CONCLUÍDA! ✓';
            btn.classList.add('completed');
            btn.disabled = true;
        } else {
            btn.textContent = 'COMPLETEI A LINHA!';
            btn.classList.remove('completed');
            btn.disabled = false;
        }
    }
}

// NOVO: renderização em tabela para meta mensal
function renderMetaMensal() {
    const container = document.getElementById('meta-mensal-linha');
    const btn = document.getElementById('btn-mensal-concluir');
    if (!container || !metaMensal) return;
    
    container.innerHTML = '';
    container.className = 'linha-table';
    
    metaMensal.linha.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'linha-table-item';
        
        if (!metaMensal.completed) {
            div.addEventListener('click', () => {
                abrirModalTroca('mensal', index);
            });
        } else {
            div.style.cursor = 'default';
        }
        
        let manobraHTML = '';
        if (item.entrada) {
            manobraHTML += `<span class="entrada">${item.entrada}</span>`;
        }
        manobraHTML += `<span class="trick-principal">${item.manobra}</span>`;
        if (item.saida) {
            manobraHTML += `<span class="saida">${item.saida}</span>`;
        }
        
        div.innerHTML = `
            <div class="linha-table-row row-numero">${item.numero}ª</div>
            <div class="linha-table-row row-local">${item.local}</div>
            <div class="linha-table-row row-manobra">${manobraHTML}</div>
        `;
        
        container.appendChild(div);
        
        if (index < metaMensal.linha.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'linha-table-arrow';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }
    });
    
    if (btn) {
        if (metaMensal.completed) {
            btn.textContent = 'CONCLUÍDA! ✓';
            btn.classList.add('completed');
            btn.disabled = true;
        } else {
            btn.textContent = 'COMPLETEI A LINHA!';
            btn.classList.remove('completed');
            btn.disabled = false;
        }
    }
}

// Gera uma linha de manobras em formato de tabela, garantindo variedade
function generateLinha(minSize, maxSize) {
    const size = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const linha = [];
    const usedTricks = new Set();
    const usedLocais = new Set();
    
    let temSlide = false;
    let temGrind = false;
    
    for (let i = 0; i < size; i++) {
        const item = {
            numero: i + 1,
            local: '',
            manobra: '',
            entrada: '',
            saida: ''
        };
        
        // Primeira e última posição = Chão
        if (i === 0 || i === size - 1) {
            item.local = 'Chão';
            item.manobra = getRandomFlatground(usedTricks);
        } else {
            // Posições do meio
            
            // Verifica se precisa forçar slide ou grind
            const posicoesRestantes = size - i - 1; // -1 porque última é chão
            let forcaCategoria = null;
            
            if (!temSlide && posicoesRestantes <= 2) {
                forcaCategoria = 'slide';
            } else if (!temGrind && posicoesRestantes <= 1) {
                forcaCategoria = 'grind';
            }
            
            // Escolhe obstáculo (não repetir)
            let localId = escolheObstaculoDisponivel(usedLocais, forcaCategoria);
            let localObj = obstaculosDisponiveis.find(o => o.id === localId);
            
            if (localId === 'manual-pad') {
                item.local = 'Manual pad';
                item.manobra = getRandomManualPad(usedTricks);
            } else {
                // Borda, corriborda ou corrimão
                item.local = localObj ? localObj.name : 'Borda';
                usedLocais.add(localId);
                
                // Decide se é slide ou grind
                let categoria;
                if (forcaCategoria === 'slide' || (!temSlide && Math.random() < 0.5)) {
                    categoria = 'slides';
                    temSlide = true;
                } else {
                    categoria = 'grinds';
                    temGrind = true;
                }
                
                item.manobra = getRandomSlideGrind(categoria, usedTricks);
                
                // Flip in/out se configurado
                if (configFlipInOut) {
                    if (Math.random() < 0.3) {
                        item.entrada = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' in';
                    }
                    if (Math.random() < 0.3) {
                        item.saida = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' out';
                    }
                }
            }
        }
        
        if (item.manobra) {
            usedTricks.add(item.manobra);
            linha.push(item);
        }
    }
    
    return linha;
}

function escolheObstaculoDisponivel(usedLocais, forcaCategoria) {
    // Se precisa forçar slide/grind, escolhe obstáculo que permite isso
    let opcoes = obstaculosPista.filter(o => !usedLocais.has(o));
    
    // Se forçando slide/grind, remove manual-pad das opções
    if (forcaCategoria === 'slide' || forcaCategoria === 'grind') {
        opcoes = opcoes.filter(o => o !== 'manual-pad');
    }
    
    // Se não tem opções, permite repetir
    if (opcoes.length === 0) {
        opcoes = obstaculosPista.filter(o => o !== 'manual-pad');
    }
    
    if (opcoes.length === 0) {
        return 'borda';
    }
    
    return opcoes[Math.floor(Math.random() * opcoes.length)];
}

function getRandomFlatground(usedTricks) {
    if (!tricksData || !tricksData.flatground) return 'Ollie';
    
    const progress = JSON.parse(localStorage.getItem('shunskating-progress') || '{}');
    
    const eligible = tricksData.flatground.filter(trick => {
        if (usedTricks.has(trick.name)) return false;
        
        // Verifica nível
        const stances = ['regular', 'fakie', 'nollie', 'switch'];
        for (const stance of stances) {
            const key = trick.id + '_' + stance;
            const level = progress[key] || 0;
            if (level >= 2) return true;
        }
        return trick.difficulty <= 2;
    });
    
    if (eligible.length === 0) {
        const fallback = tricksData.flatground.filter(t => !usedTricks.has(t.name) && t.difficulty <= 2);
        if (fallback.length > 0) {
            return fallback[Math.floor(Math.random() * fallback.length)].name;
        }
        return 'Ollie';
    }
    
    return eligible[Math.floor(Math.random() * eligible.length)].name;
}

function getRandomManualPad(usedTricks) {
    // Só manobras conectadas e manuais
    let tricks = [];
    if (tricksData.conectadas) tricks = tricks.concat(tricksData.conectadas);
    if (tricksData.manuais) tricks = tricks.concat(tricksData.manuais);
    
    const progress = JSON.parse(localStorage.getItem('shunskating-progress') || '{}');
    
    const eligible = tricks.filter(trick => {
        if (usedTricks.has(trick.name)) return false;
        
        const stances = ['regular', 'fakie', 'nollie', 'switch'];
        for (const stance of stances) {
            const key = trick.id + '_' + stance;
            const level = progress[key] || 0;
            if (level >= 2) return true;
        }
        return trick.difficulty <= 2;
    });
    
    if (eligible.length === 0) {
        const fallback = tricks.filter(t => !usedTricks.has(t.name) && t.difficulty <= 2);
        if (fallback.length > 0) {
            return fallback[Math.floor(Math.random() * fallback.length)].name;
        }
        return 'Manual';
    }
    
    return eligible[Math.floor(Math.random() * eligible.length)].name;
}

function getRandomSlideGrind(categoria, usedTricks) {
    if (!tricksData || !tricksData[categoria]) return categoria === 'slides' ? 'BS Boardslide' : '50-50';
    
    const progress = JSON.parse(localStorage.getItem('shunskating-progress') || '{}');
    
    const eligible = tricksData[categoria].filter(trick => {
        if (usedTricks.has(trick.name)) return false;
        
        const stances = ['regular', 'fakie', 'nollie', 'switch'];
        for (const stance of stances) {
            const key = trick.id + '_' + stance;
            const level = progress[key] || 0;
            if (level >= 2) return true;
        }
        return trick.difficulty <= 2;
    });
    
    if (eligible.length === 0) {
        const fallback = tricksData[categoria].filter(t => !usedTricks.has(t.name) && t.difficulty <= 2);
        if (fallback.length > 0) {
            return fallback[Math.floor(Math.random() * fallback.length)].name;
        }
        return categoria === 'slides' ? 'BS Boardslide' : 'FS 50-50';
    }
    
    return eligible[Math.floor(Math.random() * eligible.length)].name;
}

function abrirModalTroca(tipo, index) {
    const meta = tipo === 'semanal' ? metaSemanal : metaMensal;
    if (!meta || !meta.linha[index]) return;
    
    const item = meta.linha[index];
    trocaAtual = { tipo, index };
    
    // Sempre mostra todas as opções
    let opcoesHTML = `
        <button class="btn-troca-opcao flatground" data-categoria="flatground" data-local="Chão">🛹 Flatground (Chão)</button>
        <button class="btn-troca-opcao slide" data-categoria="slides" data-local="obstáculo">🛝 Slide</button>
        <button class="btn-troca-opcao grind" data-categoria="grinds" data-local="obstáculo">⚙️ Grind</button>
        <button class="btn-troca-opcao manual" data-categoria="conectadas" data-local="Manual pad">📏 Manual (Manual pad)</button>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal-troca';
    modal.id = 'modal-troca-manobra';
    
    let manobraTexto = '';
    if (item.entrada) manobraTexto += item.entrada + ' ';
    manobraTexto += item.manobra;
    if (item.saida) manobraTexto += ' ' + item.saida;
    
    modal.innerHTML = `
        <div class="modal-troca-content">
            <h3>Trocar Manobra</h3>
            <div class="modal-troca-atual">
                <div class="local">${item.local}</div>
                <div class="manobra">${manobraTexto}</div>
            </div>
            <div class="modal-troca-opcoes">
                ${opcoesHTML}
            </div>
            <button class="btn-troca-cancelar">Cancelar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    AudioManager.play('click');
    
    // Event listeners
    modal.querySelectorAll('.btn-troca-opcao').forEach(btn => {
        btn.addEventListener('click', () => {
            const categoria = btn.getAttribute('data-categoria');
            const novoLocal = btn.getAttribute('data-local');
            executarTroca(categoria, novoLocal);
            modal.remove();
        });
    });
    
    modal.querySelector('.btn-troca-cancelar').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function executarTroca(categoria, novoLocal) {
    const meta = trocaAtual.tipo === 'semanal' ? metaSemanal : metaMensal;
    if (!meta || !meta.linha[trocaAtual.index]) return;
    
    const item = meta.linha[trocaAtual.index];
    
    // Coleta manobras já usadas na linha (exceto a atual)
    const usedTricks = new Set();
    meta.linha.forEach((m, i) => {
        if (i !== trocaAtual.index) {
            usedTricks.add(m.manobra);
        }
    });
    
    // Atualiza o local
    if (novoLocal === 'obstáculo') {
        // Escolhe um obstáculo disponível (borda, corriborda ou corrimão)
        const obstaculosSlideGrind = obstaculosPista.filter(o => 
            o === 'borda' || o === 'corriborda' || o === 'corrimao'
        );
        if (obstaculosSlideGrind.length > 0) {
            const obsId = obstaculosSlideGrind[Math.floor(Math.random() * obstaculosSlideGrind.length)];
            const obsObj = obstaculosDisponiveis.find(o => o.id === obsId);
            item.local = obsObj ? obsObj.name : 'Borda';
        } else {
            item.local = 'Borda';
        }
    } else {
        item.local = novoLocal;
    }
    
    // Sorteia nova manobra
    let novaManobra;
    if (categoria === 'flatground') {
        novaManobra = getRandomFlatground(usedTricks);
        item.entrada = '';
        item.saida = '';
    } else if (categoria === 'conectadas') {
        novaManobra = getRandomManualPad(usedTricks);
        item.entrada = '';
        item.saida = '';
    } else if (categoria === 'slides') {
        novaManobra = getRandomSlideGrind('slides', usedTricks);
        // Mantém ou adiciona flip in/out se configurado
        if (configFlipInOut && !item.entrada && Math.random() < 0.3) {
            item.entrada = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' in';
        }
        if (configFlipInOut && !item.saida && Math.random() < 0.3) {
            item.saida = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' out';
        }
    } else if (categoria === 'grinds') {
        novaManobra = getRandomSlideGrind('grinds', usedTricks);
        if (configFlipInOut && !item.entrada && Math.random() < 0.3) {
            item.entrada = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' in';
        }
        if (configFlipInOut && !item.saida && Math.random() < 0.3) {
            item.saida = flipsInOut[Math.floor(Math.random() * flipsInOut.length)] + ' out';
        }
    }
    
    item.manobra = novaManobra;
    
    // Salva e re-renderiza
    if (trocaAtual.tipo === 'semanal') {
        localStorage.setItem('shunskating-meta-semanal', JSON.stringify(metaSemanal));
        renderMetaSemanal();
    } else {
        localStorage.setItem('shunskating-meta-mensal', JSON.stringify(metaMensal));
        renderMetaMensal();
    }
    
    AudioManager.play('save');
}

// Toggle meta diária
function toggleMetaDiaria(index) {
    if (!metasDiarias || !metasDiarias.items[index]) return;
    
    metasDiarias.items[index].completed = !metasDiarias.items[index].completed;
    localStorage.setItem('shunskating-metas-diarias', JSON.stringify(metasDiarias));
    
    AudioManager.play('save');
    renderMetasDiarias();
}

// Completar meta semanal
function completarMetaSemanal() {
    if (!metaSemanal || metaSemanal.completed) return;
    
    metaSemanal.completed = true;
    localStorage.setItem('shunskating-meta-semanal', JSON.stringify(metaSemanal));
    
    AudioManager.play('celebrate');
    renderMetaSemanal();
}

// Completar meta mensal
function completarMetaMensal() {
    if (!metaMensal || metaMensal.completed) return;
    
    metaMensal.completed = true;
    localStorage.setItem('shunskating-meta-mensal', JSON.stringify(metaMensal));
    
    AudioManager.play('celebrate');
    renderMetaMensal();
}

