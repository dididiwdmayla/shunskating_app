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

// Exporta todos os dados para JSON
function exportData() {
    try {
        const keys = getAllStorageKeys();
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            appName: 'ShunsKating',
            data: {}
        };
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data.data[key] = JSON.parse(value);
                } catch {
                    data.data[key] = value;
                }
            }
        });
        
        // Cria o arquivo JSON
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
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
        alert('✅ Backup exportado com sucesso!\n\nArquivo: ' + filename);
        
        return true;
    } catch (e) {
        console.error('Erro ao exportar:', e);
        alert('❌ Erro ao exportar dados. Tente novamente.');
        return false;
    }
}

// Importa dados de um arquivo JSON
function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const backup = JSON.parse(content);
                
                // Valida o arquivo
                if (!backup.appName || backup.appName !== 'ShunsKating') {
                    alert('❌ Arquivo inválido!\n\nEste não parece ser um backup do ShunsKating.');
                    reject('Arquivo inválido');
                    return;
                }
                
                if (!backup.data || typeof backup.data !== 'object') {
                    alert('❌ Arquivo corrompido!\n\nO backup não contém dados válidos.');
                    reject('Dados inválidos');
                    return;
                }
                
                // Confirma a importação
                const exportDate = backup.exportDate ? new Date(backup.exportDate).toLocaleDateString('pt-BR') : 'desconhecida';
                const keyCount = Object.keys(backup.data).length;
                
                const confirmed = confirm(
                    `📥 Importar Backup?\n\n` +
                    `Data do backup: ${exportDate}\n` +
                    `Itens: ${keyCount} registros\n\n` +
                    `⚠️ Seus dados atuais serão substituídos!`
                );
                
                if (!confirmed) {
                    reject('Cancelado pelo usuário');
                    return;
                }
                
                // Limpa dados antigos relacionados ao app
                const oldKeys = getAllStorageKeys();
                oldKeys.forEach(key => {
                    localStorage.removeItem(key);
                });
                
                // Restaura os dados do backup
                for (const key in backup.data) {
                    const value = backup.data[key];
                    if (typeof value === 'object') {
                        localStorage.setItem(key, JSON.stringify(value));
                    } else {
                        localStorage.setItem(key, value);
                    }
                }
                
                if (typeof AudioManager !== 'undefined') AudioManager.play('save');
                alert('✅ Dados restaurados com sucesso!\n\nO app será recarregado.');
                
                // Recarrega a página para aplicar os dados
                window.location.reload();
                
                resolve(true);
            } catch (e) {
                console.error('Erro ao importar:', e);
                alert('❌ Erro ao ler o arquivo.\n\nVerifique se é um arquivo de backup válido.');
                reject(e);
            }
        };
        
        reader.onerror = function() {
            alert('❌ Erro ao ler o arquivo.');
            reject('Erro de leitura');
        };
        
        reader.readAsText(file);
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
            const isExpanded = section.classList.contains('expanded');
            
            section.classList.toggle('expanded');
            backupContent.classList.toggle('collapsed');
            backupContent.classList.toggle('expanded');
            
            if (typeof AudioManager !== 'undefined') AudioManager.play('click');
        });
    }
    
    // Botão exportar
    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
        btnExport.onclick = (e) => {
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

