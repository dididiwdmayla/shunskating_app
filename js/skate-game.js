// ShunsKating - Game of S.K.A.T.E.

// Lista de skatistas por nível
const skatersByLevel = {
    iniciante: ['Nathan', 'Pedro', 'Vitão'],
    intermediario: ['Lucas', 'Kaique', 'Dudu'],
    intermediario_plus: ['Angel', 'Marquinhos', 'Léo'],
    avancado: ['Ruan Street', 'Kelvin', 'Biel'],
    profissional: ['Tairan', 'Gui Damasceno', 'Tiago Lemos']
};

// Variáveis do jogo
let selectedLevel = null;
let selectedGameType = 'livre';
let currentOpponent = null;
let selectedStance = 'regular';
let usedTrickStances = [];

// Sorteia um skatista do nível
function getRandomSkater(level) {
    const skaters = skatersByLevel[level];
    const index = Math.floor(Math.random() * skaters.length);
    return skaters[index];
}

// Estado do jogo
let playerLetters = 0;
let opponentLetters = 0;
let isPlayerTurn = true;
let isPlayerPulling = true; // quem está puxando a manobra
let currentTrickInGame = null;
let availableTricks = [];
let currentTrickPool = [];
let gameHistory = [];
let secondChance = false; // Segunda chance na última letra

// Multiplicador de dificuldade por base
const stanceMultiplier = {
    regular: 0,
    fakie: 1,
    nollie: 2,
    switch: 3
};

// Probabilidade do adversário escolher cada base por nível
const stanceChance = {
    iniciante: { regular: 0.85, fakie: 0.10, nollie: 0.04, switch: 0.01 },
    intermediario: { regular: 0.70, fakie: 0.18, nollie: 0.08, switch: 0.04 },
    intermediario_plus: { regular: 0.55, fakie: 0.25, nollie: 0.12, switch: 0.08 },
    avancado: { regular: 0.40, fakie: 0.28, nollie: 0.18, switch: 0.14 },
    profissional: { regular: 0.30, fakie: 0.28, nollie: 0.22, switch: 0.20 }
};

// Falas do adversário
const opponentPhrases = {
    inicio_player: ["Pode puxar, é sua", "Abre o jogo aí", "Vamo ver o que você puxa"],
    inicio_opponent: ["Comecei! Bora lá", "Vou abrir o jogo", "Deixa eu puxar uma boa"],
    puxando_facil: ["Essa é tranquila", "Vou de leve", "Só pra aquecer"],
    puxando_media: ["Bora ver essa", "Vamo complicar um pouco", "Essa é boa"],
    puxando_dificil: ["Segura essa!", "Vamo ver se aguenta", "Essa é braba!"],
    acertou_facil: ["Boa!", "Firmeza, era fácil mesmo", "Suave pra você também, né?"],
    acertou_medio: ["Eita, mandou também!", "Boa! Ficou limpo", "Tá mandando bem!"],
    acertou_dificil: ["CARALHO, você mandou essa?!", "Respeito! Essa é braba", "Que manobra foi essa, mano!"],
    errou: ["Opa, essa é minha! Letra pra você!", "Errou! Começa a pressão", "Mais uma letra!"],
    tentando: ["Vamo ver se você manda também", "Bora repetir!", "Tua vez!", "Mostra como faz"],
    adversario_errou: ["Ahh errei!", "Essa me pegou", "Vacilei nessa"],
    adversario_acertou: ["Mandei!", "Essa foi!", "Tranquilo"],
    voce_ganhando: ["Preciso acertar essa!", "Tá complicado pra mim", "Você tá mandando bem demais"],
    voce_perdendo: ["Tô mandando bem hoje!", "Tá difícil pra você, né?", "Hoje tô on fire!"],
    vitoria: ["GANHEI! Que game foi esse!", "Boa demais! Foi osso, hein?", "Foi um bom game!"],
    derrota: ["Ahh perdi! Você mandou bem", "Levou essa! Parabéns", "Da próxima eu ganho!"]
};

// Probabilidade de acerto do adversário por nível e dificuldade da manobra
const hitProbability = {
    iniciante: { 1: 0.6, 2: 0.4, 3: 0.2, 4: 0.1, 5: 0.05 },
    intermediario: { 1: 0.85, 2: 0.7, 3: 0.5, 4: 0.3, 5: 0.15 },
    intermediario_plus: { 1: 0.95, 2: 0.85, 3: 0.65, 4: 0.45, 5: 0.25 },
    avancado: { 1: 0.98, 2: 0.92, 3: 0.8, 4: 0.6, 5: 0.4 },
    profissional: { 1: 0.99, 2: 0.97, 3: 0.9, 4: 0.75, 5: 0.55 }
};

// Retorna frase aleatória de uma categoria
function getPhrase(category) {
    const phrases = opponentPhrases[category];
    return phrases[Math.floor(Math.random() * phrases.length)];
}

// Atualiza fala do adversário
function updateSpeech(text) {
    document.getElementById('speech-name').textContent = currentOpponent + ':';
    document.getElementById('speech-text').textContent = '"' + text + '"';
}

// Atualiza placar visual
function updateScoreboard() {
    const playerLettersEl = document.querySelectorAll('#player-letters .letter');
    const opponentLettersEl = document.querySelectorAll('#opponent-letters .letter');
    
    playerLettersEl.forEach((el, i) => {
        const wasEmpty = el.classList.contains('empty');
        const shouldBeFilled = i < playerLetters;
        
        el.classList.toggle('empty', !shouldBeFilled);
        
        // Animação se acabou de ganhar letra
        if (wasEmpty && shouldBeFilled) {
            el.classList.add('new');
            setTimeout(() => el.classList.remove('new'), 500);
        }
    });
    
    opponentLettersEl.forEach((el, i) => {
        const wasEmpty = el.classList.contains('empty');
        const shouldBeFilled = i < opponentLetters;
        
        el.classList.toggle('empty', !shouldBeFilled);
        
        if (wasEmpty && shouldBeFilled) {
            el.classList.add('new');
            setTimeout(() => el.classList.remove('new'), 500);
        }
    });
    
    // Shake no placar
    const scoreboard = document.querySelector('.scoreboard');
    scoreboard.classList.add('shake');
    setTimeout(() => scoreboard.classList.remove('shake'), 500);
}

// Adiciona item ao histórico
function addHistory(text) {
    gameHistory.unshift(text);
    const container = document.getElementById('history-container');
    container.innerHTML = gameHistory.map(item => 
        '<div class="history-item">' + item + '</div>'
    ).join('');
}

// Carrega manobras disponíveis baseado no tipo de jogo
function loadAvailableTricks() {
    availableTricks = [];
    
    if (selectedGameType === 'livre') {
        // Todas as categorias
        ['flatground', 'slides', 'grinds'].forEach(cat => {
            if (tricksData[cat]) {
                tricksData[cat].forEach(trick => {
                    availableTricks.push({...trick, category: cat});
                });
            }
        });
    } else {
        // Categoria específica
        if (tricksData[selectedGameType]) {
            tricksData[selectedGameType].forEach(trick => {
                availableTricks.push({...trick, category: selectedGameType});
            });
        }
    }
    
    currentTrickPool = [...availableTricks];
}

// Remove manobra do pool
function removeTrickFromPool(trickId, stance = 'regular') {
    // Cria um identificador único combinando manobra + base
    const uniqueId = trickId + '_' + stance;
    
    // Marca como usada nessa combinação
    if (!usedTrickStances) {
        usedTrickStances = [];
    }
    usedTrickStances.push(uniqueId);
    
    console.log('Removido do pool:', uniqueId);
}

// Verifica se combinação manobra+base já foi usada
function isTrickAvailable(trickId, stance = 'regular') {
    const uniqueId = trickId + '_' + stance;
    return !usedTrickStances.includes(uniqueId);
}

// Adversário escolhe manobra
function opponentChoosesTrick() {
    // Escolhe aleatório, com tendência pra manobras mais fáceis se nível baixo
    const trick = availableTricks[Math.floor(Math.random() * availableTricks.length)];
    return trick;
}

// Verifica se adversário acerta
function doesOpponentLand(trick, stance = 'regular') {
    let difficulty = trick.difficulty || 3;
    
    // Adiciona dificuldade da base
    difficulty = Math.min(5, difficulty + stanceMultiplier[stance]);
    
    const prob = hitProbability[selectedLevel][difficulty];
    return Math.random() < prob;
}

// Escolhe base do adversário
function getOpponentStance() {
    const chances = stanceChance[selectedLevel];
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [stance, chance] of Object.entries(chances)) {
        cumulative += chance;
        if (rand < cumulative) {
            return stance;
        }
    }
    return 'regular';
}

// Mostra overlay de suspense
function showSuspense(text) {
    const overlay = document.getElementById('suspense-overlay');
    const suspenseText = document.getElementById('suspense-text');
    const suspenseCard = overlay.querySelector('.suspense-card');
    const suspenseIcon = document.getElementById('suspense-icon');
    
    // Reset estado
    suspenseCard.className = 'suspense-card';
    suspenseIcon.style.display = 'block';
    overlay.querySelector('.suspense-loader').style.display = 'flex';
    
    suspenseText.textContent = text;
    overlay.classList.add('active');
}

// Mostra resultado no card de suspense
function showSuspenseResult(success, text) {
    const overlay = document.getElementById('suspense-overlay');
    const suspenseCard = overlay.querySelector('.suspense-card');
    const suspenseText = document.getElementById('suspense-text');
    const suspenseIcon = document.getElementById('suspense-icon');
    
    // Esconde loader e ícone
    overlay.querySelector('.suspense-loader').style.display = 'none';
    suspenseIcon.style.display = 'none';
    
    // Adiciona classe de resultado
    suspenseCard.classList.add('result');
    suspenseCard.classList.add(success ? 'success' : 'fail');
    
    // Muda texto
    suspenseText.innerHTML = '<p class="result-text ' + (success ? 'success' : 'fail') + '">' + text + '</p>';
}

// Esconde overlay de suspense
function hideSuspense() {
    const overlay = document.getElementById('suspense-overlay');
    overlay.classList.remove('active');
}

// Inicia o jogo
function startGame() {
    usedTrickStances = [];
    secondChance = false;
    playerLetters = 0;
    opponentLetters = 0;
    gameHistory = [];
    currentTrickInGame = null;
    
    document.getElementById('opponent-name-display').textContent = currentOpponent.toUpperCase();
    document.getElementById('current-trick').textContent = '-';
    document.getElementById('trick-label').textContent = 'Manobra:';
    document.getElementById('history-container').innerHTML = '';
    updateScoreboard();
    
    loadAvailableTricks();
    
    // Mostra tela do jogo
    showScreen('game-play');
    
    // Abre cara ou coroa
    document.getElementById('modal-coin').classList.add('active');
    document.getElementById('coin-result').textContent = '';
}

// Resultado do cara ou coroa
function coinFlip(playerChoice) {
    // Desabilita botões pra não clicar de novo
    document.getElementById('btn-cara').disabled = true;
    document.getElementById('btn-coroa').disabled = true;
    
    // Som da moeda
    AudioManager.play('coinFlip');
    
    // Delay de 1 segundo
    setTimeout(() => {
        const result = Math.random() < 0.5 ? 'cara' : 'coroa';
        const playerWins = playerChoice === result;
        
        document.getElementById('coin-result').textContent = 
            'Deu ' + result.toUpperCase() + '! ' + (playerWins ? 'Você começa!' : currentOpponent + ' começa!');
        
        setTimeout(() => {
            document.getElementById('modal-coin').classList.remove('active');
            document.getElementById('btn-cara').disabled = false;
            document.getElementById('btn-coroa').disabled = false;
            
            isPlayerPulling = playerWins;
            
            if (playerWins) {
                updateSpeech(getPhrase('inicio_player'));
                showTrickSelection();
            } else {
                updateSpeech(getPhrase('inicio_opponent'));
                setTimeout(() => opponentPullsTrick(), 1500);
            }
        }, 2000);
    }, 1000);
}

// Mostra seleção de base antes da escolha de manobra
function showTrickSelection() {
    selectedStance = 'regular';
    const stanceEl = document.getElementById('stance-selection');
    const trickSelection = document.getElementById('trick-selection');
    if (stanceEl) stanceEl.style.display = 'block';
    if (trickSelection) trickSelection.style.display = 'none';
    
    document.getElementById('trick-label').textContent = 'Sua vez de puxar!';
    document.getElementById('current-trick').textContent = '-';
    
    document.getElementById('modal-choose-trick').classList.add('active');
}

// Renderiza pool de manobras
function renderTrickPool() {
    const container = document.getElementById('trick-pool') || document.getElementById('tricks-choose-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const pool = currentTrickPool && currentTrickPool.length ? currentTrickPool : availableTricks;
    
    let available = pool.filter(trick => isTrickAvailable(trick.id, selectedStance));
    
    if (available.length === 0) {
        // Reseta o pool se acabar as combinações
        usedTrickStances = [];
        available = pool;
    }
    
    available.forEach(trick => {
        const btn = document.createElement('button');
        btn.className = 'trick-choose-btn';
        btn.textContent = trick.name;
        btn.addEventListener('click', () => playerChoosesTrick(trick));
        container.appendChild(btn);
    });
    
    const trickSelection = document.getElementById('trick-selection');
    if (trickSelection) trickSelection.style.display = 'block';
}

// Seleciona base
function selectStance(stance) {
    selectedStance = stance;
    AudioManager.play('click');
    
    const stanceEl = document.getElementById('stance-selection');
    const trickSelection = document.getElementById('trick-selection');
    if (stanceEl) stanceEl.style.display = 'none';
    if (trickSelection) trickSelection.style.display = 'block';
    
    renderTrickPool();
}

// Jogador puxa manobra
function playerChoosesTrick(trick) {
    document.getElementById('modal-choose-trick').classList.remove('active');
    
    currentTrickInGame = trick;
    currentTrickInGame.stance = selectedStance;
    
    // Monta o nome com a base (se não for regular)
    let trickName = trick.name;
    if (selectedStance !== 'regular') {
        const stanceLabel = selectedStance.charAt(0).toUpperCase() + selectedStance.slice(1);
        trickName = stanceLabel + ' ' + trick.name;
    }
    
    document.getElementById('trick-label').textContent = 'Você puxou:';
    document.getElementById('current-trick').textContent = trickName;
    
    isPlayerPulling = true;
    addHistory('Você puxou ' + trickName);
    
    // Mostra botões pro jogador dizer se acertou ou errou
    document.getElementById('btn-landed').style.display = 'block';
    document.getElementById('btn-missed').style.display = 'block';
    
    updateSpeech(getPhrase('tentando').replace('você', 'tu'));
}

// Adversário puxa manobra
function opponentPullsTrick() {
    const trick = opponentChoosesTrick();
    const opponentStance = getOpponentStance();
    
    currentTrickInGame = trick;
    currentTrickInGame.stance = opponentStance;
    
    // Monta o nome com a base
    let trickName = trick.name;
    if (opponentStance !== 'regular') {
        const stanceLabel = opponentStance.charAt(0).toUpperCase() + opponentStance.slice(1);
        trickName = stanceLabel + ' ' + trick.name;
    }
    
    // Mostra suspense
    showSuspense(currentOpponent + ' está puxando...');
    
    setTimeout(() => {
        document.getElementById('suspense-text').textContent = currentOpponent + ' vai de ' + trickName + '...';
    }, 1500);
    
    setTimeout(() => {
        // Decide o resultado UMA VEZ e guarda
        const landed = doesOpponentLand(trick, opponentStance);
        
        console.log('Adversário puxou, resultado:', landed ? 'ACERTOU' : 'ERROU');
        
        // Sons de preparação
        const trickType = trick.category || selectedGameType;
        AudioManager.play('pop');
        
        setTimeout(() => {
            // Som da manobra
            if (trickType === 'flatground') {
                AudioManager.play('flip');
            } else if (trickType === 'slides') {
                AudioManager.play('slide');
            } else if (trickType === 'grinds') {
                AudioManager.play('grind');
            }
        }, 800);
        
        setTimeout(() => {
        // Som do resultado - só um dos dois
        if (landed) {
            AudioManager.play('celebrate');
        } else {
            AudioManager.play('popFail');
            setTimeout(() => {
                AudioManager.play('frustration');
            }, 300);
        }
            
            // Mostra resultado visual
            setTimeout(() => {
                if (landed) {
                    showSuspenseResult(true, 'MANDOU! ✓');
                    addHistory(currentOpponent + ' puxou ' + trickName + ' ✓');
                    
                    setTimeout(() => {
                        hideSuspense();
                        
                        document.getElementById('trick-label').textContent = currentOpponent + ' puxou:';
                        document.getElementById('current-trick').textContent = trickName;
                        updateSpeech(getPhrase('tentando'));
                        
                        isPlayerPulling = false;
                        AudioManager.play('yourTurn');
                        document.getElementById('btn-landed').style.display = 'block';
                        document.getElementById('btn-missed').style.display = 'block';
                    }, 1500);
                } else {
                    showSuspenseResult(false, 'ERROU! ✗');
                    addHistory(currentOpponent + ' errou ao puxar ' + trickName + ' ✗');
                    
                    setTimeout(() => {
                        hideSuspense();
                        
                        document.getElementById('trick-label').textContent = 'Sua vez de puxar!';
                        document.getElementById('current-trick').textContent = '-';
                        updateSpeech(getPhrase('adversario_errou'));
                        
                        removeTrickFromPool(trick.id, opponentStance);
                        isPlayerPulling = true;
                        setTimeout(() => showTrickSelection(), 1000);
                    }, 1500);
                }
            }, 500);
        }, 1800);
    }, 3000);
}

// Jogador mandou a manobra
function playerLanded() {
    AudioManager.play('celebrate');
    document.getElementById('btn-landed').style.display = 'none';
    document.getElementById('btn-missed').style.display = 'none';
    
    // Reset segunda chance se acertou
    secondChance = false;
    
    addHistory('Você mandou ✓');
    
    if (isPlayerPulling) {
        // Eu puxei e mandei, agora adversário tenta copiar
        updateSpeech(getPhrase('tentando'));
        
        setTimeout(() => {
            showSuspense(currentOpponent + ' tentando copiar...');
            
            // Decide resultado UMA VEZ
            const landed = doesOpponentLand(currentTrickInGame, currentTrickInGame.stance || 'regular');
            
            console.log('Adversário copiando, resultado:', landed ? 'ACERTOU' : 'ERROU');
            
            // Sons de preparação
            AudioManager.play('pop');
            
            const trickType = currentTrickInGame.category || selectedGameType;
            
            setTimeout(() => {
                if (trickType === 'flatground') {
                    AudioManager.play('flip');
                } else if (trickType === 'slides') {
                    AudioManager.play('slide');
                } else if (trickType === 'grinds') {
                    AudioManager.play('grind');
                }
            }, 800);
            
            setTimeout(() => {
                // Som do resultado
                if (landed) {
                AudioManager.play('celebrate');
            } else {
                AudioManager.play('popFail');
                setTimeout(() => {
                    AudioManager.play('frustration');
                }, 300);
            }
                
                setTimeout(() => {
                    if (landed) {
                        showSuspenseResult(true, 'COPIOU! ✓');
                        
                        setTimeout(() => {
                            hideSuspense();
                            updateSpeech(getPhrase('adversario_acertou'));
                            addHistory(currentOpponent + ' copiou ✓');
                            removeTrickFromPool(currentTrickInGame.id, currentTrickInGame.stance || 'regular');
                            setTimeout(() => showTrickSelection(), 1000);
                        }, 1500);
                    } else {
                        // Verifica segunda chance
                        if (opponentLetters === 4) {
                            document.getElementById('suspense-text').textContent = 'Errou! Tentando de novo...';
                            
                            setTimeout(() => {
                                const secondTry = doesOpponentLand(currentTrickInGame, currentTrickInGame.stance || 'regular');
                                
                                AudioManager.play('pop');
                                
                                setTimeout(() => {
                                    if (secondTry) {
                                        AudioManager.play('celebrate');
                                    } else {
                                        AudioManager.play('popFail');
                                        setTimeout(() => {
                                            AudioManager.play('frustration');
                                        }, 300);
                                    }
                                    
                                    setTimeout(() => {
                                        if (secondTry) {
                                            showSuspenseResult(true, 'MANDOU NA SEGUNDA! ✓');
                                            setTimeout(() => {
                                                hideSuspense();
                                                updateSpeech(getPhrase('adversario_acertou'));
                                                addHistory(currentOpponent + ' mandou na segunda! ✓');
                                                removeTrickFromPool(currentTrickInGame.id, currentTrickInGame.stance || 'regular');
                                                setTimeout(() => showTrickSelection(), 1000);
                                            }, 1500);
                                        } else {
                                            showSuspenseResult(false, 'ERROU AS DUAS! ✗');
                                            AudioManager.play('letterGained');
                                            setTimeout(() => {
                                                hideSuspense();
                                                updateSpeech(getPhrase('adversario_errou'));
                                                opponentLetters++;
                                                updateScoreboard();
                                                addHistory(currentOpponent + ' errou as duas ✗');
                                                endGame(true);
                                            }, 1500);
                                        }
                                    }, 500);
                                }, 800);
                            }, 1500);
                            return;
                        }
                        
                        showSuspenseResult(false, 'ERROU! ✗');
                        AudioManager.play('popFail');
                        setTimeout(() => {
                            AudioManager.play('frustration');
                        }, 300);
                        AudioManager.play('letterGained');
                        
                        setTimeout(() => {
                            hideSuspense();
                            updateSpeech(getPhrase('adversario_errou'));
                            opponentLetters++;
                            updateScoreboard();
                            addHistory(currentOpponent + ' errou ✗ (ganhou letra)');
                            
                            if (opponentLetters >= 5) {
                                endGame(true);
                            } else {
                                removeTrickFromPool(currentTrickInGame.id, currentTrickInGame.stance || 'regular');
                                setTimeout(() => showTrickSelection(), 1000);
                            }
                        }, 1500);
                    }
                }, 500);
            }, 1800);
        }, 1000);
    } else {
        // Eu estava copiando e mandei
        let phraseCategory = 'acertou_medio';
        if (currentTrickInGame.difficulty === 'facil') phraseCategory = 'acertou_facil';
        if (currentTrickInGame.difficulty === 'dificil') phraseCategory = 'acertou_dificil';
        
        updateSpeech(getPhrase(phraseCategory));
        addHistory('Você copiou ✓');
        
        // Eu copiei, adversário CONTINUA PUXANDO
        removeTrickFromPool(currentTrickInGame.id, currentTrickInGame.stance || 'regular');
        setTimeout(() => opponentPullsTrick(), 2000);
    }
}

// Jogador errou a manobra
function playerMissed() {
    AudioManager.play('popFail');
    setTimeout(() => {
        AudioManager.play('frustration');
    }, 300);
    document.getElementById('btn-landed').style.display = 'none';
    document.getElementById('btn-missed').style.display = 'none';
    
    if (isPlayerPulling) {
        // Eu puxei e errei - SEM LETRA, só passa a vez
        addHistory('Você errou ao puxar ✗');
        updateSpeech(getPhrase('voce_perdendo'));
        // NÃO remove do pool - pode tentar de novo depois
        isPlayerPulling = false;
        setTimeout(() => opponentPullsTrick(), 2000);
    } else {
        // Eu estava copiando e errei
        
        // Verifica se tenho 4 letras e ainda não usei segunda chance
        if (playerLetters === 4 && !secondChance) {
            secondChance = true;
            addHistory('Você errou, mas tem mais uma chance!');
            updateSpeech('"Última chance, hein!"');
            
            // Mostra botões de novo
            setTimeout(() => {
                document.getElementById('btn-landed').style.display = 'block';
                document.getElementById('btn-missed').style.display = 'block';
            }, 1500);
            return;
        }
        
        // Ganha letra
        secondChance = false;
        playerLetters++;
        updateScoreboard();
        AudioManager.play('letterGained');
        updateSpeech(getPhrase('errou'));
        addHistory('Você errou ✗ (ganhou letra)');
        
        if (playerLetters >= 5) {
            endGame(false);
        } else {
            // Adversário CONTINUA puxando
            // NÃO remove do pool - pode tentar de novo depois
            setTimeout(() => opponentPullsTrick(), 2000);
        }
    }
}

// Fim do jogo
function endGame(playerWon) {
    // Som de vitória ou derrota
    if (playerWon) {
        AudioManager.play('victory');
    } else {
        AudioManager.play('defeat');
    }
    
    setTimeout(() => {
        const title = document.getElementById('game-over-title');
        title.textContent = playerWon ? 'VOCÊ GANHOU!' : 'VOCÊ PERDEU!';
        title.className = playerWon ? '' : 'lost';
        
        const letters = ['S', 'K', 'A', 'T', 'E'];
        document.getElementById('final-player-letters').textContent = 
            letters.slice(0, playerLetters).join('-') || '-';
        document.getElementById('final-opponent-letters').textContent = 
            letters.slice(0, opponentLetters).join('-') || '-';
        document.getElementById('final-opponent-name').textContent = currentOpponent;
        
        updateSpeech(getPhrase(playerWon ? 'derrota' : 'vitoria'));
        
        document.getElementById('modal-game-over').classList.add('active');
    }, 1500);
}

// Reiniciar jogo
function restartGame() {
    document.getElementById('modal-game-over').classList.remove('active');
    startGame();
}

// ==========================================
// EVENT LISTENERS DO GAME - MOBILE FIX
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Iniciando event listeners do Game...');
    
    // Botão voltar do menu do game
    const btnBackGameMenu = document.getElementById('btn-back-game-menu');
    if (btnBackGameMenu) {
        console.log('✓ Botão voltar encontrado');
        
        const voltarHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão voltar clicado!');
            if (typeof AudioManager !== 'undefined') AudioManager.play('swipeBack');
            if (typeof showScreen === 'function') showScreen('home');
        };
        
        btnBackGameMenu.onclick = voltarHandler;
    }
    
    // Botões de dificuldade
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    console.log('Botões de dificuldade encontrados:', difficultyButtons.length);
    
    difficultyButtons.forEach(button => {
        const diffHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Dificuldade clicada:', button.dataset.level);
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('filter');
            
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedLevel = button.dataset.level;
            
            const startBtn = document.getElementById('btn-start-game');
            if (startBtn) startBtn.disabled = false;
        };
        
        button.onclick = diffHandler;
    });
    
    // Botões de tipo de game
    const gameTypeButtons = document.querySelectorAll('.game-type-btn');
    console.log('Botões de tipo encontrados:', gameTypeButtons.length);
    
    gameTypeButtons.forEach(button => {
        const typeHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Tipo clicado:', button.dataset.type);
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('filter');
            
            gameTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedGameType = button.dataset.type;
        };
        
        button.onclick = typeHandler;
    });
    
    // Botão iniciar game
    const startGameBtn = document.getElementById('btn-start-game');
    if (startGameBtn) {
        console.log('✓ Botão iniciar encontrado');
        
        const startHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Iniciar game clicado!');
            
            if (!selectedLevel) {
                alert('Selecione uma dificuldade!');
                return;
            }
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('click');
            currentOpponent = getRandomSkater(selectedLevel);
            startGame();
        };
        
        startGameBtn.onclick = startHandler;
    }
    
    // Botões Cara ou Coroa
    const btnCara = document.getElementById('btn-cara');
    const btnCoroa = document.getElementById('btn-coroa');
    
    if (btnCara) {
        console.log('✓ Botão Cara encontrado');
        btnCara.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cara clicado!');
            coinFlip('cara');
        };
    }
    
    if (btnCoroa) {
        console.log('✓ Botão Coroa encontrado');
        btnCoroa.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Coroa clicado!');
            coinFlip('coroa');
        };
    }
    
    // Botões de ação do jogo (Mandei / Errei)
    const btnLanded = document.getElementById('btn-landed');
    const btnMissed = document.getElementById('btn-missed');
    
    if (btnLanded) {
        console.log('✓ Botão Mandei encontrado');
        btnLanded.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mandei clicado!');
            playerLanded();
        };
    }
    
    if (btnMissed) {
        console.log('✓ Botão Errei encontrado');
        btnMissed.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Errei clicado!');
            playerMissed();
        };
    }
    
    // Botão sair do jogo
    const btnQuitGame = document.getElementById('btn-quit-game');
    if (btnQuitGame) {
        console.log('✓ Botão Sair encontrado');
        btnQuitGame.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Tem certeza que quer sair do game?')) {
                if (typeof showScreen === 'function') showScreen('game-menu');
            }
        };
    }
    
    // Botões do fim de jogo
    const btnPlayAgain = document.getElementById('btn-play-again');
    const btnChangeOpponent = document.getElementById('btn-change-opponent');
    const btnBackMenu = document.getElementById('btn-back-menu');
    
    if (btnPlayAgain) {
        btnPlayAgain.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            restartGame();
        };
    }
    
    if (btnChangeOpponent) {
        btnChangeOpponent.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('modal-game-over').classList.remove('active');
            if (typeof showScreen === 'function') showScreen('game-menu');
        };
    }
    
    if (btnBackMenu) {
        btnBackMenu.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('modal-game-over').classList.remove('active');
            if (typeof showScreen === 'function') showScreen('home');
        };
    }
    
    // Botões de seleção de base (stance) no Game
    const stanceButtons = document.querySelectorAll('#stance-selection .stance-btn');
    console.log('Botões de stance encontrados:', stanceButtons.length);
    
    stanceButtons.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const stance = btn.getAttribute('data-stance');
            console.log('Stance clicada:', stance);
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('click');
            
            stanceButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectStance(stance);
        };
    });
    
    // Botão voltar para mudar base
    const btnBackStance = document.getElementById('btn-back-stance');
    if (btnBackStance) {
        console.log('✓ Botão voltar stance encontrado');
        btnBackStance.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Voltar stance clicado!');
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('swipeBack');
            document.getElementById('trick-selection').style.display = 'none';
            document.getElementById('stance-selection').style.display = 'block';
        };
    }
    
    console.log('🎮 Event listeners do Game configurados!');
});
