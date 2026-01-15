// ==========================================
// SISTEMA DE BACKUP DE DADOS
// ==========================================

// Chaves do localStorage que devem ser salvas
function getAllStorageKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shunskating')) {
            keys.push(key);
        }
    }
    // Também inclui chaves de highlights
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hl_')) {
            keys.push(key);
        }
    }
    return keys;
}

// Abre modal de opções antes de exportar
function openExportModal() {
    const modal = document.getElementById('modal-export');
    if (modal) {
        modal.classList.add('active');
        if (typeof AudioManager !== 'undefined') AudioManager.play('click');
    }
}

// Fecha modal de exportação
function closeExportModal() {
    const modal = document.getElementById('modal-export');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Exporta todos os dados para JSON
async function exportData() {
    try {
        // Pega as opções selecionadas
        const includeHighlights = document.getElementById('export-highlights')?.checked ?? true;
        const includeMetas = document.getElementById('export-metas')?.checked ?? true;
        const includeVideos = document.getElementById('export-videos')?.checked ?? true;
        const includeMusic = document.getElementById('export-music')?.checked ?? false;
        
        const data = {
            version: '1.1',
            exportDate: new Date().toISOString(),
            appName: 'ShunsKating',
            options: {
                highlights: includeHighlights,
                metas: includeMetas,
                videos: includeVideos,
                music: includeMusic
            },
            localStorage: {},
            indexedDB: {
                videos: [],
                music: []
            }
        };
        
        // Exporta localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            // Sempre inclui progresso e anotações
            const isProgress = key.startsWith('shunskating-progress') || 
                              key.startsWith('shunskating-notes') ||
                              key.startsWith('shunskating-links') ||
                              key.startsWith('shunskating-favorites');
            
            const isHighlight = key.startsWith('hl_');
            const isMetas = key.startsWith('shunskating-meta');
            const isAppConfig = key.startsWith('shunskating-app');
            
            if (isProgress || isAppConfig) {
                data.localStorage[key] = localStorage.getItem(key);
            } else if (isHighlight && includeHighlights) {
                data.localStorage[key] = localStorage.getItem(key);
            } else if (isMetas && includeMetas) {
                data.localStorage[key] = localStorage.getItem(key);
            }
        }
        
        // Exporta vídeos do IndexedDB
        if (includeVideos) {
            try {
                const videos = await exportVideosFromDB();
                data.indexedDB.videos = videos;
            } catch (e) {
                console.log('Erro ao exportar vídeos:', e);
            }
        }
        
        // Exporta músicas do IndexedDB
        if (includeMusic) {
            try {
                const music = await exportMusicFromDB();
                data.indexedDB.music = music;
            } catch (e) {
                console.log('Erro ao exportar músicas:', e);
            }
        }
        
        // Cria o arquivo JSON
        const jsonString = JSON.stringify(data);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Calcula tamanho do arquivo
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        
        // Cria link de download
        const date = new Date().toISOString().split('T')[0];
        const filename = `shunskating-backup-${date}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof AudioManager !== 'undefined') AudioManager.play('save');
        alert(`✅ Backup exportado!\n\nArquivo: ${filename}\nTamanho: ${sizeMB} MB`);
        
        closeExportModal();
        
        return true;
    } catch (e) {
        console.error('Erro ao exportar:', e);
        alert('❌ Erro ao exportar dados. Tente novamente.');
        return false;
    }
}

// Exporta vídeos do IndexedDB
function exportVideosFromDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ShunsKatingVideos', 1);
        
        request.onerror = () => reject('Erro ao abrir DB de vídeos');
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            
            if (!db.objectStoreNames.contains('videos')) {
                resolve([]);
                return;
            }
            
            const transaction = db.transaction(['videos'], 'readonly');
            const store = transaction.objectStore('videos');
            const getAll = store.getAll();
            
            getAll.onsuccess = async () => {
                const videos = getAll.result || [];
                const exportedVideos = [];
                
                for (const video of videos) {
                    try {
                        // Converte blob para base64
                        const base64 = await blobToBase64(video.blob);
                        exportedVideos.push({
                            id: video.id,
                            trickId: video.trickId,
                            name: video.name,
                            type: video.type,
                            date: video.date,
                            data: base64
                        });
                    } catch (e) {
                        console.log('Erro ao converter vídeo:', e);
                    }
                }
                
                resolve(exportedVideos);
            };
            
            getAll.onerror = () => reject('Erro ao ler vídeos');
        };
        
        request.onupgradeneeded = (e) => {
            // DB não existe ainda
            resolve([]);
        };
    });
}

// Exporta músicas do IndexedDB
function exportMusicFromDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ShunsKatingMusic', 1);
        
        request.onerror = () => reject('Erro ao abrir DB de músicas');
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            
            if (!db.objectStoreNames.contains('tracks')) {
                resolve([]);
                return;
            }
            
            const transaction = db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const getAll = store.getAll();
            
            getAll.onsuccess = async () => {
                const tracks = getAll.result || [];
                const exportedTracks = [];
                
                for (const track of tracks) {
                    try {
                        // Converte blob para base64
                        const base64 = await blobToBase64(track.blob);
                        exportedTracks.push({
                            id: track.id,
                            name: track.name,
                            artist: track.artist,
                            duration: track.duration,
                            type: track.type,
                            cover: track.cover,
                            data: base64
                        });
                    } catch (e) {
                        console.log('Erro ao converter música:', e);
                    }
                }
                
                resolve(exportedTracks);
            };
            
            getAll.onerror = () => reject('Erro ao ler músicas');
        };
        
        request.onupgradeneeded = (e) => {
            // DB não existe ainda
            resolve([]);
        };
    });
}

// Converte Blob para Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject('Erro ao converter');
        reader.readAsDataURL(blob);
    });
}

// Converte Base64 para Blob
function base64ToBlob(base64) {
    try {
        const parts = base64.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.log('Erro ao converter base64:', e);
        return null;
    }
}

// Importa dados de um arquivo JSON
async function importData(file) {
    try {
        const content = await readFileAsText(file);
        const backup = JSON.parse(content);
        
        // Valida o arquivo
        if (!backup.appName || backup.appName !== 'ShunsKating') {
            alert('❌ Arquivo inválido!\n\nEste não parece ser um backup do ShunsKating.');
            return;
        }
        
        // Info do backup
        const exportDate = backup.exportDate ? new Date(backup.exportDate).toLocaleDateString('pt-BR') : 'desconhecida';
        const hasVideos = backup.indexedDB?.videos?.length > 0;
        const hasMusic = backup.indexedDB?.music?.length > 0;
        const localStorageCount = Object.keys(backup.localStorage || backup.data || {}).length;
        
        let info = `📥 Importar Backup?\n\n`;
        info += `Data: ${exportDate}\n`;
        info += `Configurações: ${localStorageCount} itens\n`;
        if (hasVideos) info += `Vídeos: ${backup.indexedDB.videos.length}\n`;
        if (hasMusic) info += `Músicas: ${backup.indexedDB.music.length}\n`;
        info += `\n⚠️ Seus dados atuais serão substituídos!`;
        
        if (!confirm(info)) return;
        
        // Restaura localStorage
        const localData = backup.localStorage || backup.data || {};
        
        // Limpa dados antigos
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('shunskating') || key.startsWith('hl_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Restaura novos dados
        for (const key in localData) {
            localStorage.setItem(key, localData[key]);
        }
        
        // Restaura vídeos
        if (hasVideos) {
            await importVideosToDB(backup.indexedDB.videos);
        }
        
        // Restaura músicas
        if (hasMusic) {
            await importMusicToDB(backup.indexedDB.music);
        }
        
        if (typeof AudioManager !== 'undefined') AudioManager.play('save');
        alert('✅ Dados restaurados com sucesso!\n\nO app será recarregado.');
        
        window.location.reload();
    } catch (e) {
        console.error('Erro ao importar:', e);
        alert('❌ Erro ao importar dados.\n\nVerifique se o arquivo está correto.');
    }
}

// Lê arquivo como texto
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject('Erro ao ler arquivo');
        reader.readAsText(file);
    });
}

// Importa vídeos para IndexedDB
function importVideosToDB(videos) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ShunsKatingVideos', 1);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('videos')) {
                db.createObjectStore('videos', { keyPath: 'id', autoIncrement: true });
            }
        };
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction(['videos'], 'readwrite');
            const store = transaction.objectStore('videos');
            
            // Limpa vídeos antigos
            store.clear();
            
            // Adiciona novos
            videos.forEach(video => {
                const blob = base64ToBlob(video.data);
                if (blob) {
                    store.add({
                        trickId: video.trickId,
                        name: video.name,
                        type: video.type,
                        date: video.date,
                        blob: blob
                    });
                }
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject('Erro ao importar vídeos');
        };
        
        request.onerror = () => reject('Erro ao abrir DB');
    });
}

// Importa músicas para IndexedDB
function importMusicToDB(tracks) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ShunsKatingMusic', 1);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('tracks')) {
                db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
            }
        };
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            
            // Limpa músicas antigas
            store.clear();
            
            // Adiciona novas
            tracks.forEach(track => {
                const blob = base64ToBlob(track.data);
                if (blob) {
                    store.add({
                        name: track.name,
                        artist: track.artist,
                        duration: track.duration,
                        type: track.type,
                        cover: track.cover,
                        blob: blob
                    });
                }
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject('Erro ao importar músicas');
        };
        
        request.onerror = () => reject('Erro ao abrir DB');
    });
}

// Inicializa os event listeners
function initBackupSystem() {
    // Toggle da seção
    const backupHeader = document.getElementById('backup-header');
    const backupContent = document.getElementById('backup-content');
    
    if (backupHeader && backupContent) {
        backupHeader.addEventListener('click', () => {
            const section = backupHeader.closest('.dicas-backup');
            
            section.classList.toggle('expanded');
            backupContent.classList.toggle('collapsed');
            backupContent.classList.toggle('expanded');
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('click');
        });
    }
    
    // Botão exportar - abre modal
    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
        btnExport.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openExportModal();
        };
    }
    
    // Modal - botão cancelar
    const btnCancelExport = document.getElementById('btn-cancel-export');
    if (btnCancelExport) {
        btnCancelExport.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeExportModal();
        };
    }
    
    // Modal - botão confirmar
    const btnConfirmExport = document.getElementById('btn-confirm-export');
    if (btnConfirmExport) {
        btnConfirmExport.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            exportData();
        };
    }
    
    // Botão importar
    const btnImport = document.getElementById('btn-import-data');
    const fileInput = document.getElementById('import-file-input');
    
    if (btnImport && fileInput) {
        btnImport.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        };
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                importData(file);
            }
            fileInput.value = '';
        };
    }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initBackupSystem);
