/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - File Tree & Dependency State Machine
 * File: js/fileTree.js
 */

const FileTreeModule = {
    STATUS_ENUM: {
        NOT_STARTED: 'Not Started',
        DRAFTED: 'Drafted',
        SAFE_TESTED: 'Safe & Tested',
        ERROR_NEED_FIX: 'Error/Need Fix'
    },
    currentFilter: 'ALL',

    /**
     * Memeriksa apakah file ter kunci karena prasyarat (prerequisites) belum Safe & Tested
     */
    checkDependencyStatus(fileId) {
        if (!window.StorageEngine) return { isLocked: false, pendingPrereqs: [] };
        
        const data = window.StorageEngine.getData();
        const file = data.fileTree.find(f => f.id === fileId);
        if (!file || !file.prerequisites || file.prerequisites.length === 0) {
            return { isLocked: false, pendingPrereqs: [] };
        }

        const pendingPrereqs = [];
        file.prerequisites.forEach(prereqId => {
            const prereqFile = data.fileTree.find(f => f.id === prereqId);
            if (!prereqFile || prereqFile.status !== this.STATUS_ENUM.SAFE_TESTED) {
                pendingPrereqs.push(prereqFile ? prereqFile.fileName : prereqId);
            }
        });

        return {
            isLocked: pendingPrereqs.length > 0,
            pendingPrereqs
        };
    },

    renderTree() {
        const container = document.getElementById('file-tree-container');
        if (!container || !window.StorageEngine) return;

        const data = window.StorageEngine.getData();
        const fileTree = data.fileTree || [];

        let safeCount = 0;
        let lockedCount = 0;
        let errorCount = 0;

        fileTree.forEach(f => {
            if (f.status === this.STATUS_ENUM.SAFE_TESTED) safeCount++;
            if (f.status === this.STATUS_ENUM.ERROR_NEED_FIX) errorCount++;
            const dep = this.checkDependencyStatus(f.id);
            if (dep.isLocked) lockedCount++;
        });

        const totalEl = document.getElementById('tree-stat-total');
        const safeEl = document.getElementById('tree-stat-safe');
        const lockedEl = document.getElementById('tree-stat-locked');
        const errorEl = document.getElementById('tree-stat-error');

        if (totalEl) totalEl.textContent = fileTree.length;
        if (safeEl) safeEl.textContent = safeCount;
        if (lockedEl) lockedEl.textContent = lockedCount;
        if (errorEl) errorEl.textContent = errorCount;

        const filtered = fileTree.filter(f => {
            const dep = this.checkDependencyStatus(f.id);
            if (this.currentFilter === 'LOCKED') return dep.isLocked;
            if (this.currentFilter === 'SAFE') return f.status === this.STATUS_ENUM.SAFE_TESTED;
            if (this.currentFilter === 'ERROR') return f.status === this.STATUS_ENUM.ERROR_NEED_FIX;
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                    <i class="fa-solid fa-folder-open text-3xl text-slate-600 mb-2"></i>
                    <p class="text-xs font-mono text-slate-400">Tidak ada berkas yang cocok dengan filter [${this.currentFilter}].</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(file => {
            const dep = this.checkDependencyStatus(file.id);
            const isLocked = dep.isLocked;

            const badgeClass = file.status === this.STATUS_ENUM.SAFE_TESTED ? 'status-badge-safe' :
                               file.status === this.STATUS_ENUM.DRAFTED ? 'status-badge-drafted' :
                               file.status === this.STATUS_ENUM.ERROR_NEED_FIX ? 'status-badge-error' :
                               'status-badge-not-started';

            const prereqNames = (file.prerequisites || []).map(pId => {
                const found = fileTree.find(x => x.id === pId);
                const isSafe = found && found.status === this.STATUS_ENUM.SAFE_TESTED;
                return `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono border ${isSafe ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border-rose-800 text-rose-300'}">${found ? found.fileName : pId}</span>`;
            }).join(' ');

            return `
                <div class="dependency-card ${isLocked ? 'card-locked' : ''} p-4 rounded-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
                    ${isLocked ? `
                        <div class="absolute top-0 right-0 left-0 bg-rose-950/80 border-b border-rose-800/60 px-3 py-1 flex items-center justify-between text-[10px] text-rose-300 font-mono">
                            <span class="flex items-center gap-1.5"><i class="fa-solid fa-lock text-rose-400"></i> PREREQUISITES PENDING</span>
                            <span class="truncate max-w-[150px] opacity-80">${dep.pendingPrereqs.join(', ')}</span>
                        </div>
                    ` : ''}

                    <div class="${isLocked ? 'pt-5' : ''} space-y-2">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <span class="text-[10px] font-mono text-sky-400 font-bold">${file.id}</span>
                                <h3 class="text-sm font-bold text-white truncate hover:text-sky-300 transition">${file.fileName}</h3>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${badgeClass}">${file.status}</span>
                        </div>

                        <p class="text-[11px] font-mono text-slate-400 truncate bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                            <i class="fa-regular fa-file-code text-slate-500 mr-1"></i>${file.path}
                        </p>

                        <div class="pt-1">
                            <span class="text-[10px] font-mono text-slate-500 uppercase block mb-1">Prerequisites:</span>
                            <div class="flex flex-wrap gap-1">
                                ${prereqNames || '<span class="text-[10px] font-mono text-slate-600">None (Root Level)</span>'}
                            </div>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <select onchange="FileTreeModule.updateFileStatus('${file.id}', this.value)" class="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 font-mono focus:outline-none focus:border-sky-400">
                            <option value="Not Started" ${file.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="Drafted" ${file.status === 'Drafted' ? 'selected' : ''}>Drafted</option>
                            <option value="Safe & Tested" ${file.status === 'Safe & Tested' ? 'selected' : ''}>Safe & Tested</option>
                            <option value="Error/Need Fix" ${file.status === 'Error/Need Fix' ? 'selected' : ''}>Error/Need Fix</option>
                        </select>

                        <div class="flex items-center space-x-1">
                            <button onclick="FileTreeModule.openEditModal('${file.id}')" class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition" title="Edit File">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button onclick="FileTreeModule.confirmDelete('${file.id}')" class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition" title="Hapus File">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateFileStatus(fileId, newStatus) {
        if (!window.StorageEngine) return;
        const data = window.StorageEngine.getData();
        const file = data.fileTree.find(f => f.id === fileId);
        if (!file) return;

        if (newStatus === this.STATUS_ENUM.SAFE_TESTED) {
            const dep = this.checkDependencyStatus(fileId);
            if (dep.isLocked) {
                if (typeof window.showToast === 'function') {
                    window.showToast(`Gagal! Berkas [${file.fileName}] belum bisa di-mark Safe & Tested karena prasyarat (${dep.pendingPrereqs.join(', ')}) belum aman!`, 'error');
                }
                this.renderTree();
                return;
            }
        }

        file.status = newStatus;
        window.StorageEngine.saveData(data);
        if (typeof window.showToast === 'function') {
            window.showToast(`Status berkas [${file.fileName}] diperbarui ke "${newStatus}".`, 'success');
        }
        this.renderTree();
    },

    openAddModal() {
        const modal = document.getElementById('file-modal');
        const form = document.getElementById('file-modal-form');
        const title = document.getElementById('file-modal-title');
        const fileIdInput = document.getElementById('modal-file-id');

        if (title) title.innerHTML = `<i class="fa-solid fa-file-circle-plus text-sky-400"></i> Tambah Berkas Proyek Baru`;
        if (fileIdInput) fileIdInput.value = '';
        if (form) form.reset();

        this.populatePrereqCheckboxes([]);
        if (modal) modal.classList.remove('hidden');
    },

    openEditModal(fileId) {
        if (!window.StorageEngine) return;
        const data = window.StorageEngine.getData();
        const file = data.fileTree.find(f => f.id === fileId);
        if (!file) return;

        const modal = document.getElementById('file-modal');
        const title = document.getElementById('file-modal-title');
        const idInput = document.getElementById('modal-file-id');
        const nameInput = document.getElementById('modal-file-name');
        const pathInput = document.getElementById('modal-file-path');
        const statusSelect = document.getElementById('modal-file-status');

        if (title) title.innerHTML = `<i class="fa-solid fa-pen-to-square text-sky-400"></i> Edit Berkas [${file.fileName}]`;
        if (idInput) idInput.value = file.id;
        if (nameInput) nameInput.value = file.fileName;
        if (pathInput) pathInput.value = file.path;
        if (statusSelect) statusSelect.value = file.status;

        this.populatePrereqCheckboxes(file.prerequisites || [], file.id);
        if (modal) modal.classList.remove('hidden');
    },

    populatePrereqCheckboxes(selectedIds = [], currentFileId = null) {
        const container = document.getElementById('modal-prereq-container');
        if (!container || !window.StorageEngine) return;

        const data = window.StorageEngine.getData();
        const availableFiles = data.fileTree.filter(f => f.id !== currentFileId);

        if (availableFiles.length === 0) {
            container.innerHTML = `<span class="text-slate-500 italic">Belum ada file lain yang dapat dijadikan prasyarat.</span>`;
            return;
        }

        container.innerHTML = availableFiles.map(f => `
            <label class="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
                <input type="checkbox" name="modal-prereq-check" value="${f.id}" ${selectedIds.includes(f.id) ? 'checked' : ''} class="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500">
                <span>${f.fileName} <span class="text-[10px] text-slate-500">(${f.path})</span></span>
            </label>
        `).join('');
    },

    saveModalSubmit(e) {
        e.preventDefault();
        if (!window.StorageEngine) return;

        const data = window.StorageEngine.getData();
        const fileId = document.getElementById('modal-file-id').value;
        const fileName = document.getElementById('modal-file-name').value.trim();
        const path = document.getElementById('modal-file-path').value.trim();
        const status = document.getElementById('modal-file-status').value;

        const prereqChecks = document.querySelectorAll('input[name="modal-prereq-check"]:checked');
        const prerequisites = Array.from(prereqChecks).map(cb => cb.value);

        if (fileId) {
            const file = data.fileTree.find(f => f.id === fileId);
            if (file) {
                file.fileName = fileName;
                file.path = path;
                file.status = status;
                file.prerequisites = prerequisites;
            }
        } else {
            const newId = 'f' + (data.fileTree.length + 1);
            data.fileTree.push({
                id: newId,
                fileName,
                path,
                status,
                prerequisites
            });
        }

        window.StorageEngine.saveData(data);
        const modal = document.getElementById('file-modal');
        if (modal) modal.classList.add('hidden');

        if (typeof window.showToast === 'function') {
            window.showToast(`Berkas [${fileName}] berhasil disimpan!`, 'success');
        }
        this.renderTree();
    },

    confirmDelete(fileId) {
        if (!window.StorageEngine) return;
        const data = window.StorageEngine.getData();
        const file = data.fileTree.find(f => f.id === fileId);
        if (!file) return;

        if (typeof window.showConfirmModal === 'function') {
            window.showConfirmModal(
                'Hapus Berkas Dependensi',
                `Apakah Anda yakin ingin menghapus file "${file.fileName}" dari struktur tree?`,
                () => {
                    data.fileTree = data.fileTree.filter(f => f.id !== fileId);
                    data.fileTree.forEach(f => {
                        if (f.prerequisites) {
                            f.prerequisites = f.prerequisites.filter(p => p !== fileId);
                        }
                    });
                    window.StorageEngine.saveData(data);
                    if (typeof window.showToast === 'function') {
                        window.showToast(`Berkas [${file.fileName}] berhasil dihapus.`, 'info');
                    }
                    this.renderTree();
                }
            );
        }
    }
};

window.FileTreeModule = FileTreeModule;