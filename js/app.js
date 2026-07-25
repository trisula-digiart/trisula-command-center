/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - Main Client App Engine & Bootstrapper
 * File: js/app.js
 * Engine: TRISULACODER v10.2
 * Status: Phase 4 Fully Integrated Engine (Zero Feature Loss)
 */

// Global State Management
let sidebarCollapsed = false;

/**
 * Memperbarui tampilan Jam UTC di Top Header setiap detik
 */
function updateClock() {
    try {
        const now = new Date();
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        const clockEl = document.getElementById('live-clock');
        if (clockEl) {
            clockEl.textContent = `${hours}:${minutes}:${seconds} UTC`;
        }
    } catch (error) {
        console.error('[TCC Clock Engine Error]:', error);
    }
}

/**
 * Mengontrol animasi ciut/lebar (Collapse/Expand) pada Sidebar
 */
function toggleSidebar() {
    try {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('toggle-icon');
        const sidebarTexts = document.querySelectorAll('.sidebar-text');

        if (!sidebar || !toggleIcon) return;

        sidebarCollapsed = !sidebarCollapsed;

        if (sidebarCollapsed) {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-20');
            toggleIcon.className = 'fa-solid fa-chevron-right text-xs';
            sidebarTexts.forEach(el => el.classList.add('hidden'));
        } else {
            sidebar.classList.remove('w-20');
            sidebar.classList.add('w-64');
            toggleIcon.className = 'fa-solid fa-chevron-left text-xs';
            sidebarTexts.forEach(el => el.classList.remove('hidden'));
        }
    } catch (error) {
        console.error('[TCC Sidebar Toggle Error]:', error);
    }
}

/**
 * Helper untuk menampilkan Toast Notification pengganti alert native
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-900/90 border-emerald-600 text-emerald-200' :
                    type === 'error' ? 'bg-rose-900/90 border-rose-600 text-rose-200' :
                    'bg-sky-900/90 border-sky-600 text-sky-200';
    
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';

    toast.className = `pointer-events-auto flex items-center space-x-2 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-md text-xs font-medium ${bgClass} transition-all duration-300 transform translate-y-2 opacity-0`;
    toast.innerHTML = `<i class="fa-solid ${icon} text-sm"></i><span>${message}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/**
 * Helper untuk menampilkan Custom Confirm Modal pengganti confirm native
 */
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('confirm-modal-title');
    const modalMsg = document.getElementById('confirm-modal-msg');
    const btnCancel = document.getElementById('btn-modal-cancel');
    const btnConfirm = document.getElementById('btn-modal-confirm');

    if (!modal) return;

    if (modalTitle) modalTitle.textContent = title;
    if (modalMsg) modalMsg.textContent = message;
    modal.classList.remove('hidden');

    const handleCancel = () => {
        modal.classList.add('hidden');
        btnCancel?.removeEventListener('click', handleCancel);
        btnConfirm?.removeEventListener('click', handleConfirm);
    };

    const handleConfirm = () => {
        modal.classList.add('hidden');
        btnCancel?.removeEventListener('click', handleCancel);
        btnConfirm?.removeEventListener('click', handleConfirm);
        if (typeof onConfirm === 'function') onConfirm();
    };

    btnCancel?.addEventListener('click', handleCancel);
    btnConfirm?.addEventListener('click', handleConfirm);
}

/**
 * Inisialisasi Aplikasi saat DOM selesai dimuat
 */
document.addEventListener('DOMContentLoaded', () => {
    // Expose fungsi-fungsi utama ke global window
    window.updateClock = updateClock;
    window.toggleSidebar = toggleSidebar;
    window.showToast = showToast;
    window.showConfirmModal = showConfirmModal;

    // Jalankan mesin jam UTC
    updateClock();
    setInterval(updateClock, 1000);

    // Inisialisasi StorageEngine & NavigationController jika tersedia
    if (window.StorageEngine) {
        window.StorageEngine.initStorage();
        window.StorageEngine.updateUIStats();
    }

    if (window.NavigationController) {
        window.NavigationController.init();
    }

    // Bind Event Sidebar Toggle Button
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    // Bind Event Modul FileTree (Tambah Berkas & Submit Form Modal)
    const btnAddModal = document.getElementById('btn-add-file-modal');
    if (btnAddModal && window.FileTreeModule) {
        btnAddModal.addEventListener('click', () => window.FileTreeModule.openAddModal());
    }

    const btnCloseModal = document.getElementById('btn-close-file-modal');
    const btnCancelModal = document.getElementById('btn-cancel-file-modal');
    const fileModal = document.getElementById('file-modal');

    if (btnCloseModal && fileModal) {
        btnCloseModal.addEventListener('click', () => fileModal.classList.add('hidden'));
    }
    if (btnCancelModal && fileModal) {
        btnCancelModal.addEventListener('click', () => fileModal.classList.add('hidden'));
    }

    const fileForm = document.getElementById('file-modal-form');
    if (fileForm && window.FileTreeModule) {
        fileForm.addEventListener('submit', (e) => window.FileTreeModule.saveModalSubmit(e));
    }

    // Bind Event Filter Buttons pada Tree View (ALL, LOCKED, SAFE, ERROR)
    const filterBtns = document.querySelectorAll('.tree-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-slate-800', 'text-sky-400', 'font-semibold');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('bg-slate-800', 'text-sky-400', 'font-semibold');
            if (window.FileTreeModule) {
                window.FileTreeModule.currentFilter = btn.getAttribute('data-filter');
                window.FileTreeModule.renderTree();
            }
        });
    });

    // Bind Event Modul TCG (Command Generator Studio)
    const tcgForm = document.getElementById('tcg-config-form');
    if (tcgForm && window.TCGEngineModule) {
        tcgForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fileId = document.getElementById('tcg-file-select')?.value;
            const mode = document.getElementById('tcg-mode-select')?.value;
            const customInstructions = document.getElementById('tcg-custom-instructions')?.value;
            const includeBlueprint = document.getElementById('tcg-check-blueprint')?.checked;
            const includePrereqs = document.getElementById('tcg-check-prereqs')?.checked;

            window.TCGEngineModule.generatePrompt({
                fileId,
                mode,
                customInstructions,
                includeBlueprint,
                includePrereqs
            });
        });
    }

    const btnCopyTCG = document.getElementById('btn-copy-tcg');
    if (btnCopyTCG && window.TCGEngineModule) {
        btnCopyTCG.addEventListener('click', () => window.TCGEngineModule.copyToClipboard());
    }

    const btnClearTCG = document.getElementById('btn-clear-tcg');
    if (btnClearTCG && window.TCGEngineModule) {
        btnClearTCG.addEventListener('click', () => window.TCGEngineModule.clearOutput());
    }

    // Bind Event Backup & Settings Tab (Export, Import JSON, Reset State)
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport && window.StorageEngine) {
        btnExport.addEventListener('click', () => window.StorageEngine.exportJSON());
    }

    const btnImportTrigger = document.getElementById('btn-import-trigger');
    const inputImport = document.getElementById('import-json-input');
    if (btnImportTrigger && inputImport && window.StorageEngine) {
        btnImportTrigger.addEventListener('click', () => inputImport.click());
        inputImport.addEventListener('change', (e) => {
            if (e.target.files.length > 0) window.StorageEngine.importJSON(e.target.files[0]);
        });
    }

    const btnReset = document.getElementById('btn-reset-system');
    if (btnReset && window.StorageEngine) {
        btnReset.addEventListener('click', () => {
            showConfirmModal(
                'Konfirmasi Reset Sistem',
                'Apakah Anda yakin ingin mengembalikan seluruh data LocalStorage ke pengaturan awal?',
                () => window.StorageEngine.resetData()
            );
        });
    }

    console.log('%c[TRISULA COMMAND CENTER] Client Engine Active. Version: 1.2 Enterprise (Phase 4 Engaged)', 'color: #38bdf8; font-weight: bold; font-size: 12px;');
});