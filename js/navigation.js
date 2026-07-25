/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - SPA Navigation & View Router Engine
 * File: js/navigation.js
 * Engine: TRISULACODER v10.2
 */

const NavigationController = {
    activeTab: 'flow-auditor',
    tabTitles: {
        'dashboard': { title: 'DASHBOARD / OVERVIEW', breadcrumb: 'overview' },
        'flow-auditor': { title: 'FLOW AUDITOR (SYNC VISUAL)', breadcrumb: 'flow-auditor' },
        'architecture': { title: 'ARCHITECTURE & BLUEPRINT', breadcrumb: 'architecture' },
        'file-tree': { title: 'TASK & FILE DEPENDENCY TREE', breadcrumb: 'task-tree' },
        'tcg': { title: 'COMMAND GENERATOR (TCG ENGINE)', breadcrumb: 'cmd-generator' },
        'code-vault': { title: 'CODE VAULT & REVISION STORE', breadcrumb: 'code-vault' },
        'error-tracker': { title: 'ERROR TRACKER & RESOLUTION', breadcrumb: 'error-tracker' },
        'backup-settings': { title: 'BACKUP & SYSTEM SETTINGS', breadcrumb: 'settings' }
    },

    /**
     * Inisialisasi router dan muat memori tab terakhir dari LocalStorage
     */
    init() {
        if (window.StorageEngine) {
            const data = window.StorageEngine.getData();
            if (data.activeTab && this.tabTitles[data.activeTab]) {
                this.activeTab = data.activeTab;
            }
        }

        this.bindEvents();
        this.switchTab(this.activeTab);
    },

    /**
     * Memasang event listener pada tombol navigasi sidebar
     */
    bindEvents() {
        const navButtons = document.querySelectorAll('#sidebar-nav button[data-tab]');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    },

    /**
     * Berpindah tab tampilan dan memperbarui state aktif di memori
     */
    switchTab(tabId) {
        if (!this.tabTitles[tabId]) return;

        this.activeTab = tabId;

        if (window.StorageEngine) {
            const data = window.StorageEngine.getData();
            data.activeTab = tabId;
            window.StorageEngine.saveData(data);
        }

        // Sembunyikan semua tab container
        const views = document.querySelectorAll('.tab-view');
        views.forEach(view => view.classList.add('hidden'));

        // Reset styling tombol navigasi
        const navBtns = document.querySelectorAll('#sidebar-nav button');
        navBtns.forEach(btn => btn.classList.remove('nav-item-active'));

        // Tampilkan tab target
        const targetView = document.getElementById(`view-${tabId}`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }

        // Aktifkan tombol navigasi target
        const targetBtn = document.querySelector(`#sidebar-nav button[data-tab="${tabId}"]`);
        if (targetBtn) {
            targetBtn.classList.add('nav-item-active');
        }

        // Update teks Header Title & Breadcrumb
        const titleEl = document.getElementById('page-title');
        const breadcrumbEl = document.getElementById('page-breadcrumb');
        if (titleEl) titleEl.textContent = this.tabTitles[tabId].title;
        if (breadcrumbEl) breadcrumbEl.textContent = this.tabTitles[tabId].breadcrumb;

        // Render konten dinamis tab
        this.renderViewContent(tabId);
    },

    /**
     * Mengisi konten dinamis sesuai dengan tab yang diaktifkan
     */
    renderViewContent(tabId) {
        if (!window.StorageEngine) return;
        const data = window.StorageEngine.getData();

        if (tabId === 'flow-auditor' && window.FlowAuditorModule) {
            window.FlowAuditorModule.render();
        } else if (tabId === 'dashboard' && window.DashboardModule) {
            window.DashboardModule.renderDashboard();
        } else if (tabId === 'file-tree' && window.FileTreeModule) {
            window.FileTreeModule.renderTree();
        } else if (tabId === 'tcg' && window.TCGEngineModule) {
            window.TCGEngineModule.initTCG();
        } else if (tabId === 'code-vault' && window.CodeVaultModule) {
            window.CodeVaultModule.renderVault();
        } else if (tabId === 'error-tracker' && window.ErrorTrackerModule) {
            window.ErrorTrackerModule.renderErrors();
        } else if (tabId === 'architecture') {
            const container = document.getElementById('architecture-blueprint-content');
            if (container && data.blueprint) {
                container.innerHTML = `
                    <div class="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
                        <h4 class="font-bold text-sky-400 uppercase">Tech Stack Ledger</h4>
                        <ul class="list-disc list-inside text-slate-300 space-y-1">
                            ${data.blueprint.techStack.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
                        <h4 class="font-bold text-emerald-400 uppercase">Architecture Specs</h4>
                        <p class="text-slate-300">${data.blueprint.architectureSpecs}</p>
                    </div>
                `;
            }
        }
    }
};

window.NavigationController = NavigationController;
