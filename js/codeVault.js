/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - Code Vault & Snippet Store
 * File: js/codeVault.js
 */
const CodeVaultModule = {
    renderVault() {
        const container = document.getElementById('code-vault-container');
        if (!container || !window.StorageEngine) return;

        const data = window.StorageEngine.getData();
        const codeVault = data.codeVault || [];
        const fileTree = data.fileTree || [];

        if (codeVault.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                    <i class="fa-solid fa-box-archive text-3xl text-slate-600 mb-2"></i>
                    <p class="text-xs font-mono text-slate-400">Belum ada snippet kode tersimpan di Code Vault.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = codeVault.map(vault => {
            const file = fileTree.find(f => f.id === vault.fileId);
            const fileName = file ? file.fileName : vault.fileId;

            return `
                <div class="glass-panel p-4 rounded-xl space-y-3 relative overflow-hidden border border-slate-800">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                            <span class="text-[10px] text-sky-400 font-bold">${vault.version || 'v1.0'}</span>
                            <h3 class="text-sm font-bold text-white truncate">${fileName}</h3>
                        </div>
                        <span class="text-[10px] text-slate-500">${new Date(vault.timestamp).toLocaleDateString()}</span>
                    </div>

                    <p class="text-xs text-slate-400 italic">${vault.notes || 'Tanpa catatan'}</p>

                    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-40 overflow-y-auto">
                        <pre class="text-xs text-emerald-400 font-mono whitespace-pre-wrap">${this.escapeHTML(vault.codeText)}</pre>
                    </div>

                    <div class="flex items-center justify-end space-x-2 pt-1">
                        <button onclick="CodeVaultModule.copySnippet('${vault.id}')" class="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] transition">
                            <i class="fa-regular fa-copy mr-1"></i>Copy
                        </button>
                        <button onclick="CodeVaultModule.deleteSnippet('${vault.id}')" class="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-700 text-rose-200 text-[11px] transition">
                            <i class="fa-solid fa-trash mr-1"></i>Hapus
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    openAddModal() {
        const modal = document.getElementById('vault-modal');
        const fileSelect = document.getElementById('vault-file-select');
        const data = window.StorageEngine ? window.StorageEngine.getData() : {};

        if (!fileSelect) return;
        fileSelect.innerHTML = (data.fileTree || []).map(f => `<option value="${f.id}">${f.fileName} (${f.path})</option>`).join('');

        modal.classList.remove('hidden');
    },

    saveSnippetModal(e) {
        e.preventDefault();
        const fileId = document.getElementById('vault-file-select').value;
        const version = document.getElementById('vault-version-input').value.trim() || 'v1.0';
        const notes = document.getElementById('vault-notes-input').value.trim();
        const codeText = document.getElementById('vault-code-input').value;

        const data = window.StorageEngine.getData();
        if (!data.codeVault) data.codeVault = [];

        data.codeVault.push({
            id: 'v' + Date.now(),
            fileId,
            version,
            notes,
            codeText,
            timestamp: new Date().toISOString()
        });

        window.StorageEngine.saveData(data);
        document.getElementById('vault-modal').classList.add('hidden');
        document.getElementById('vault-modal-form').reset();
        window.showToast('Snippet kode berhasil disimpan ke Vault!', 'success');
        this.renderVault();
    },

    copySnippet(vaultId) {
        const data = window.StorageEngine.getData();
        const item = (data.codeVault || []).find(v => v.id === vaultId);
        if (item && item.codeText && window.TCGEngineModule) {
            window.TCGEngineModule.fallbackCopyToClipboard(item.codeText);
            window.showToast('Snippet kode disalin ke clipboard!', 'success');
        }
    },

    deleteSnippet(vaultId) {
        window.showConfirmModal(
            'Hapus Snippet Vault',
            'Apakah Anda yakin ingin menghapus snippet kode ini dari Vault?',
            () => {
                const data = window.StorageEngine.getData();
                data.codeVault = (data.codeVault || []).filter(v => v.id !== vaultId);
                window.StorageEngine.saveData(data);
                window.showToast('Snippet kode dihapus.', 'info');
                this.renderVault();
            }
        );
    },

    escapeHTML(str) {
        return str ? str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        ) : '';
    }
};

window.CodeVaultModule = CodeVaultModule;