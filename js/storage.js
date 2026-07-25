/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - LocalStorage & JSON Backup Engine
 * File: js/storage.js
 * Engine: TRISULACODER v10.2
 */

const StorageEngine = {
    KEY: 'TCC_STORAGE_V12',
    DEFAULT_STATE: {
        projectInfo: {
            name: "Trisula Command Center",
            version: "1.2 Enterprise",
            owner: "Lead Architect",
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        },
        blueprint: {
            techStack: ["Tailwind CSS v3", "Vanilla JS ES6+", "LocalStorage API", "FontAwesome v6"],
            architectureSpecs: "Clean Architecture SPA with LocalStorage State Management Engine",
            globalVariables: ["TCC_STORAGE_V12", "sidebarCollapsed", "currentTab"]
        },
        fileTree: [
            { id: "f1", fileName: "kasir.js", path: "modules/kasir.js", status: "Safe & Tested", prerequisites: [] },
            { id: "f2", fileName: "laporanHutang.js", path: "modules/laporanHutang.js", status: "Safe & Tested", prerequisites: ["f1"] },
            { id: "f3", fileName: "dataPelanggan.js", path: "modules/dataPelanggan.js", status: "Safe & Tested", prerequisites: ["f2"] },
            { id: "f4", fileName: "dataSupplier.js", path: "modules/dataSupplier.js", status: "Error/Need Fix", prerequisites: [] },
            { id: "f5", fileName: "dataStokBarang.js", path: "modules/dataStokBarang.js", status: "Safe & Tested", prerequisites: ["f4"] }
        ],
        // Default preset nodes matching user flow diagram specification
        flowAuditor: {
            nodes: [
                { id: "n1", fileId: "f1", label: "kasir", subtext: "Jika pelanggan berhutang", x: 60, y: 50 },
                { id: "n2", fileId: "f2", label: "Laporan hutang/piutang", subtext: "", x: 420, y: 50 },
                { id: "n3", fileId: "f3", label: "Data Pelanggan", subtext: "", x: 420, y: 180 },
                { id: "n4", fileId: "f4", label: "Data Supplier", subtext: "", x: 650, y: 180 },
                { id: "n5", fileId: "f5", label: "Data Stok Barang", subtext: "Jika ada barang masuk dari supplier dan jika toko berhutang ke supplier", x: 60, y: 320 }
            ],
            connections: [
                { from: "n1", to: "n2" },
                { from: "n2", to: "n3" },
                { from: "n5", to: "n4" }
            ]
        },
        codeVault: [],
        errorLogs: [],
        activeTab: "flow-auditor"
    },

    /**
     * Inisialisasi Storage saat aplikasi pertama kali dimuat
     */
    initStorage() {
        try {
            const existingData = localStorage.getItem(this.KEY);
            if (!existingData) {
                this.saveData(this.DEFAULT_STATE);
                console.log('[TCC StorageEngine]: Initialized DEFAULT_STATE.');
            }
        } catch (e) {
            console.error('[TCC StorageEngine Init Error]:', e);
        }
    },

    /**
     * Mengambil seluruh data state dari LocalStorage
     */
    getData() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? JSON.parse(raw) : this.DEFAULT_STATE;
        } catch (e) {
            console.error('[TCC StorageEngine Read Error]:', e);
            return this.DEFAULT_STATE;
        }
    },

    /**
     * Menyimpan data state baru ke LocalStorage
     */
    saveData(data) {
        try {
            data.projectInfo.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.KEY, JSON.stringify(data));
            this.updateUIStats();
            return true;
        } catch (e) {
            console.error('[TCC StorageEngine Save Error]:', e);
            return false;
        }
    },

    /**
     * Mengunduh cadangan data proyek sebagai file JSON
     */
    exportJSON() {
        try {
            const data = this.getData();
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const filename = `TCC_Backup_${dateStr}.json`;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (typeof window.showToast === 'function') {
                window.showToast(`Backup berhasil diunduh: ${filename}`, 'success');
            }
        } catch (e) {
            console.error('[TCC Export Error]:', e);
        }
    },

    /**
     * Membaca dan memulihkan state dari file JSON pengguna
     */
    importJSON(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.projectInfo && parsed.fileTree) {
                    this.saveData(parsed);
                    if (typeof window.showToast === 'function') {
                        window.showToast('Data JSON berhasil diimpor & dipulihkan!', 'success');
                    }
                    setTimeout(() => window.location.reload(), 1000);
                }
            } catch (err) {
                console.error('[TCC Import Error]:', err);
            }
        };
        reader.readAsText(file);
    },

    /**
     * Mengembalikan data LocalStorage ke state bawaan
     */
    resetData() {
        this.saveData(this.DEFAULT_STATE);
        if (typeof window.showToast === 'function') {
            window.showToast('Sistem berhasil dikembalikan ke default!', 'info');
        }
        setTimeout(() => window.location.reload(), 1000);
    },

    /**
     * Menghitung total ukuran memori terpakai oleh LocalStorage key
     */
    getStorageSize() {
        const raw = localStorage.getItem(this.KEY) || '';
        const bytes = new Blob([raw]).size;
        return (bytes / 1024).toFixed(2) + ' KB';
    },

    /**
     * Memperbarui indikator status kuota di antarmuka
     */
    updateUIStats() {
        const data = this.getData();
        const size = this.getStorageSize();

        const sideStorageSize = document.getElementById('sidebar-storage-size');
        const setStorageSize = document.getElementById('settings-storage-size');
        const dashStorageSize = document.getElementById('dash-storage-size');
        const dashFileCount = document.getElementById('dash-file-count');

        if (sideStorageSize) sideStorageSize.textContent = size;
        if (setStorageSize) setStorageSize.textContent = size;
        if (dashStorageSize) dashStorageSize.textContent = size;
        if (dashFileCount) dashFileCount.textContent = `${data.fileTree ? data.fileTree.length : 0} File`;
    }
};

window.StorageEngine = StorageEngine;
