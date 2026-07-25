/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - Smart Error Tracker & Bug Center
 * File: js/errorTracker.js
 */
const ErrorTrackerModule = {
    renderErrors() {
        const container = document.getElementById('error-tracker-container');
        if (!container || !window.StorageEngine) return;

        const data = window.StorageEngine.getData();
        const errorLogs = data.errorLogs || [];
        const fileTree = data.fileTree || [];

        if (errorLogs.length === 0) {
            container.innerHTML = `
                <div class="py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                    <i class="fa-solid fa-shield-cat text-4xl text-emerald-400/60 mb-2"></i>
                    <h3 class="text-sm font-bold text-slate-300">Sistem Bebas Error!</h3>
                    <p class="text-xs font-mono text-slate-500 mt-1">Belum ada laporan bug/error aktif yang tercatat.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = errorLogs.map(err => {
            const file = fileTree.find(f => f.id === err.fileTarget);
            const fileName = file ? file.fileName : err.fileTarget;

            const severityClass = err.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border-rose-700' :
                                  err.severity === 'High' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                                  'bg-sky-950 text-sky-300 border-sky-700';

            const statusClass = err.status === 'Resolved' ? 'bg-emerald-950 text-emerald-400 border-emerald-700' :
                                'bg-rose-950 text-rose-400 border-rose-700 animate-pulse';

            return `
                <div class="glass-panel p-4 rounded-xl space-y-3 border border-slate-800 relative">
                    <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${severityClass}">${err.severity}</span>
                            <h3 class="text-xs font-bold text-white">${fileName}</h3>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass}">${err.status}</span>
                            <span class="text-[10px] text-slate-500">${new Date(err.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>

                    <p class="text-xs text-rose-200 bg-rose-950/30 p-2.5 rounded border border-rose-900/40">${err.errorDescription}</p>

                    <div class="flex items-center justify-end space-x-2 pt-1">
                        ${err.status !== 'Resolved' ? `
                            <button onclick="ErrorTrackerModule.resolveError('${err.id}')" class="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] transition flex items-center gap-1">
                                <i class="fa-solid fa-check"></i> Mark Resolved
                            </button>
                        ` : ''}
                        <button onclick="ErrorTrackerModule.deleteError('${err.id}')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] transition">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    openLogModal() {
        const modal = document.getElementById('error-modal');
        const fileSelect = document.getElementById('error-file-select');
        const data = window.StorageEngine ? window.StorageEngine.getData() : {};

        if (!fileSelect) return;
        fileSelect.innerHTML = (data.fileTree || []).map(f => `<option value="${f.id}">${f.fileName} (${f.path})</option>`).join('');

        modal.classList.remove('hidden');
    },

    saveErrorModal(e) {
        e.preventDefault();
        const fileTarget = document.getElementById('error-file-select').value;
        const severity = document.getElementById('error-severity-select').value;
        const errorDescription = document.getElementById('error-desc-input').value.trim();

        const data = window.StorageEngine.getData();
        if (!data.errorLogs) data.errorLogs = [];

        data.errorLogs.push({
            id: 'err-' + Date.now(),
            fileTarget,
            severity,
            errorDescription,
            status: 'Open',
            timestamp: new Date().toISOString()
        });

        const file = (data.fileTree || []).find(f => f.id === fileTarget);
        if (file) {
            file.status = 'Error/Need Fix';
        }

        window.StorageEngine.saveData(data);
        document.getElementById('error-modal').classList.add('hidden');
        document.getElementById('error-modal-form').reset();
        window.showToast('Log bug/error berhasil dicatat!', 'error');
        this.renderErrors();
    },

    resolveError(errorId) {
        const data = window.StorageEngine.getData();
        const err = (data.errorLogs || []).find(e => e.id === errorId);
        if (err) {
            err.status = 'Resolved';
            window.StorageEngine.saveData(data);
            window.showToast('Status error ditandai sebagai Resolved!', 'success');
            this.renderErrors();
        }
    },

    deleteError(errorId) {
        const data = window.StorageEngine.getData();
        data.errorLogs = (data.errorLogs || []).filter(e => e.id !== errorId);
        window.StorageEngine.saveData(data);
        window.showToast('Log error dihapus.', 'info');
        this.renderErrors();
    }
};

window.ErrorTrackerModule = ErrorTrackerModule;