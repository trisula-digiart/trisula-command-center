/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - Command Prompt Generator Engine (TCG v6.1)
 * File: js/tcgEngine.js
 * Engine: TRISULACODER v10.2
 */

const TCGEngineModule = {
    /**
     * Memuat dan mengisi dropdown berkas target dari StorageEngine
     */
    initTCG() {
        try {
            const selectEl = document.getElementById('tcg-file-select');
            if (!selectEl) return;

            const data = window.StorageEngine ? window.StorageEngine.getData() : null;
            const fileTree = (data && data.fileTree) ? data.fileTree : [];

            // Reset options
            selectEl.innerHTML = '<option value="">-- Pilih Berkas Target --</option>';

            if (fileTree.length === 0) {
                const opt = document.createElement('option');
                opt.value = "";
                opt.textContent = "Belum ada file terdaftar di File Tree";
                opt.disabled = true;
                selectEl.appendChild(opt);
                return;
            }

            fileTree.forEach(file => {
                const opt = document.createElement('option');
                opt.value = file.id;
                opt.textContent = `${file.fileName} (${file.path}) - [${file.status}]`;
                selectEl.appendChild(opt);
            });

            console.log('[TCGEngineModule]: Target files populated successfully.');
        } catch (error) {
            console.error('[TCGEngineModule Init Error]:', error);
        }
    },

    /**
     * Meracik prompt sintetis berbasis data berkas, mode eksekusi, dan konteks blueprint
     * @param {Object} config - Konfigurasi input dari formulir TCG Studio
     */
    generatePrompt(config) {
        try {
            const { fileId, mode, customInstructions, includeBlueprint, includePrereqs } = config;
            const data = window.StorageEngine ? window.StorageEngine.getData() : null;
            if (!data) return;

            const file = data.fileTree.find(f => f.id === fileId);
            if (!file) {
                if (typeof window.showToast === 'function') {
                    window.showToast('Silakan pilih berkas target terlebih dahulu!', 'error');
                }
                return;
            }

            // Ambil daftar file prasyarat
            let prereqList = [];
            if (file.prerequisites && file.prerequisites.length > 0) {
                prereqList = file.prerequisites.map(pId => {
                    const found = data.fileTree.find(x => x.id === pId);
                    return found ? `${found.fileName} (${found.status})` : pId;
                });
            }

            // Penentuan Title & Execution Scope Mode
            let modeTitle = "";
            let modeGoal = "";
            switch (mode) {
                case 'ERROR_FIX':
                    modeTitle = "ERROR RECOVERY & BUG ISOLATION EXECUTION";
                    modeGoal = "Isolasi bug runtime, lakukan root-cause analysis, dan perbaiki kode secara utuh hingga bebas dari error.";
                    break;
                case 'REFACTOR':
                    modeTitle = "CODE REFACTORING & OPTIMIZATION EXECUTION";
                    modeGoal = "Restrukturisasi kode agar lebih bersih (clean code), optimasi penggunaan memori, serta hilangkan redundansi.";
                    break;
                case 'UNIT_TEST':
                    modeTitle = "UNIT TESTING & QUALITY ASSURANCE AUDIT";
                    modeGoal = "Buatkan rangkaian unit test yang ketat dan lakukan audit reliabilitas pada fungsi-fungsi utama berkas.";
                    break;
                case 'NEW_FEATURE':
                default:
                    modeTitle = "MASTER PROMPT FEATURE EXECUTION";
                    modeGoal = "Implementasikan fitur baru secara lengkap dan utuh dengan standar Enterprise Grade.";
                    break;
            }

            // Merakit teks prompt sintetis
            const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
            let promptText = `======================================================================
MASTER PROMPT EXECUTION: TRISULA COMMAND CENTER (TCC) v1.2
TARGET MODE : ${modeTitle}
TARGET FILE : ${file.fileName} (${file.path})
TIMESTAMP   : ${now}
======================================================================

Bro TRISULACODER v10.2, jalankan instruksi pengkodean untuk berkas proyek berikut:

----------------------------------------------------------------------
1. SPESIFIKASI BERKAS TARGET & METADATA
----------------------------------------------------------------------
- Nama File   : ${file.fileName}
- Lokasi Path : ${file.path}
- ID Berkas   : ${file.id}
- Status Saat Ini : ${file.status}
`;

            if (includePrereqs) {
                promptText += `- Prasyarat Dependensi: ${prereqList.length > 0 ? prereqList.join(', ') : 'None (Root Level)'}\n`;
            }

            if (includeBlueprint && data.blueprint) {
                promptText += `\n----------------------------------------------------------------------
2. BLUEPRINT ARCHITECTURE CONTEXT
----------------------------------------------------------------------
- Tech Stack : ${data.blueprint.techStack ? data.blueprint.techStack.join(', ') : 'Standard Web Tech'}
- Specs      : ${data.blueprint.architectureSpecs || 'Clean Architecture'}
`;
            }

            promptText += `\n----------------------------------------------------------------------
3. TARGET GOAL & INSTRUKSIONAL KHUSUS
----------------------------------------------------------------------
Target Utama:
${modeGoal}

Instruksi Tambahan / Log Detail:
${customInstructions ? customInstructions.trim() : 'Jalankan implementasi standar tanpa error runtime.'}

----------------------------------------------------------------------
4. ATURAN KODE WAJIB (ZERO HALLUCINATION & ZERO FEATURE LOSS)
----------------------------------------------------------------------
1. Berikan KODE SUMBER UTUH DENGAN FILE BLOCK RESMI.
2. DILARANG MEMOTONG KODE (Dilarang keras menggunakan placeholder "// ... kode lama").
3. Pastikan kode langsung runnable, efisien, dan memiliki sistem error handling try/catch yang kuat.
4. Terapkan visual cyber aesthetics jika berkas berhubungan dengan antarmuka UI.

Langsung berikan file kode perbaikan/implementasi utuhnya sekarang, bro!`;

            // Tampilkan ke Output Console Area
            const outputEl = document.getElementById('tcg-output-preview');
            if (outputEl) {
                outputEl.textContent = promptText;
            }

            if (typeof window.showToast === 'function') {
                window.showToast(`Command Prompt untuk [${file.fileName}] berhasil diracik!`, 'success');
            }

        } catch (error) {
            console.error('[TCGEngineModule Generate Error]:', error);
        }
    },

    /**
     * Menyalin teks hasil sintesis prompt ke clipboard pengguna
     */
    copyToClipboard() {
        try {
            const outputEl = document.getElementById('tcg-output-preview');
            if (!outputEl) return;

            const textToCopy = outputEl.textContent;
            if (!textToCopy || textToCopy.includes('Pilih file target pada form konfigurasi')) {
                if (typeof window.showToast === 'function') {
                    window.showToast('Belum ada prompt sintetis yang diracik!', 'error');
                }
                return;
            }

            // Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    this.triggerCopySuccessFeedback();
                }).catch(err => {
                    this.fallbackCopyToClipboard(textToCopy);
                });
            } else {
                this.fallbackCopyToClipboard(textToCopy);
            }
        } catch (error) {
            console.error('[TCGEngineModule Copy Error]:', error);
        }
    },

    /**
     * Fallback copy jika Clipboard API diblokir lingkungan browser
     */
    fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.triggerCopySuccessFeedback();
        } catch (err) {
            if (typeof window.showToast === 'function') {
                window.showToast('Gagal menyalin teks ke clipboard!', 'error');
            }
        }
    },

    /**
     * Efek visual feedback saat copy berhasil
     */
    triggerCopySuccessFeedback() {
        const btnText = document.getElementById('btn-copy-tcg-text');
        const btn = document.getElementById('btn-copy-tcg');

        if (btnText && btn) {
            const originalText = btnText.textContent;
            btnText.textContent = "Copied!";
            btn.classList.remove('bg-sky-600', 'hover:bg-sky-500');
            btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');

            setTimeout(() => {
                btnText.textContent = originalText;
                btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
                btn.classList.add('bg-sky-600', 'hover:bg-sky-500');
            }, 2000);
        }

        if (typeof window.showToast === 'function') {
            window.showToast('Command Prompt berhasil disalin ke clipboard!', 'success');
        }
    },

    /**
     * Membersihkan konsol tampilan output prompt
     */
    clearOutput() {
        const outputEl = document.getElementById('tcg-output-preview');
        if (outputEl) {
            outputEl.textContent = `/* TRISULA COMMAND GENERATOR (TCG) v6.1 OUTPUT CONSOLE */\n/* Solusi otomatis pembuat Master Prompt & Error Recovery System */\n\nConsole telah dibersihkan. Pilih file target lalu klik "Synthesize Command Prompt".`;
        }
        if (typeof window.showToast === 'function') {
            window.showToast('Console output dibersihkan.', 'info');
        }
    }
};

window.TCGEngineModule = TCGEngineModule;