/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - Static Code Parser & Automated Desync Detector Engine
 * File: js/codeInspector.js
 * Engine: TRISULACODER v10.2
 * Architecture: Standalone Client-Side Code Parsing & Inspector Module
 */

const CodeInspectorModule = {
    // In-memory cache for loaded local JS files & parse metrics
    loadedFiles: [], // Array of { name: string, content: string, fileId: string }
    parsedResults: [], // Array of { fileName: string, declaredFunctions: [], calledFunctions: [] }
    desyncLogs: [],

    /**
     * Membaca daftar berkas JS yang diunggah/di-drop oleh pengguna dari PC
     * @param {FileList|Array} files - File list dari input atau drag-and-drop
     */
    async handleFilesUploaded(files) {
        if (!files || files.length === 0) return;

        this.loadedFiles = [];
        const filePromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                if (!file.name.endsWith('.js') && !file.name.endsWith('.html')) {
                    resolve(null);
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        name: file.name,
                        size: file.size,
                        content: e.target.result,
                        lastModified: file.lastModified
                    });
                };
                reader.onerror = (err) => reject(err);
                reader.readAsText(file);
            });
        });

        try {
            const results = await Promise.all(filePromises);
            this.loadedFiles = results.filter(res => res !== null);

            if (typeof window.showToast === 'function') {
                window.showToast(`${this.loadedFiles.length} berkas JS berhasil diunggah & dibaca ke memori inspektor!`, 'success');
            }

            this.updateUploadedUI();
        } catch (error) {
            console.error('[CodeInspectorModule Load Error]:', error);
            if (typeof window.showToast === 'function') {
                window.showToast('Gagal membaca berkas lokal dari PC!', 'error');
            }
        }
    },

    /**
     * Mengekstrak deklarasi fungsi dan pemanggilan fungsi dari kode sumber JavaScript
     * @param {string} codeContent - Isi teks mentah kode JS
     */
    parseJSContent(codeContent) {
        const declaredFunctions = new Set();
        const calledFunctions = new Set();

        if (!codeContent) return { declaredFunctions: [], calledFunctions: [] };

        // 1. Match function declarations: function myFunc(...)
        const funcDeclRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
        let match;
        while ((match = funcDeclRegex.exec(codeContent)) !== null) {
            if (match[1]) declaredFunctions.add(match[1]);
        }

        // 2. Match const/let/var function assignments: const myFunc = (...) => or function(...)
        const constFuncRegex = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/g;
        while ((match = constFuncRegex.exec(codeContent)) !== null) {
            if (match[1]) declaredFunctions.add(match[1]);
        }

        // 3. Match object methods / module exports: myFunc(...) or Module.myFunc =
        const objMethodRegex = /(?:this|window|[a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)\s*=\s*(?:function|\()/g;
        while ((match = objMethodRegex.exec(codeContent)) !== null) {
            if (match[1]) declaredFunctions.add(match[1]);
        }

        // 4. Match function calls: myFunc(...)
        const funcCallRegex = /(?:[a-zA-Z0-9_$]+\.)?([a-zA-Z0-9_$]+)\s*\(/g;
        while ((match = funcCallRegex.exec(codeContent)) !== null) {
            const funcName = match[1];
            // Filter keyword bawaan JS agar tidak terdeteksi sebagai fungsi custom
            const jsKeywords = ['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'import', 'export', 'require', 'parseInt', 'parseFloat', 'console', 'log', 'error', 'warn', 'push', 'map', 'forEach', 'filter', 'reduce', 'slice', 'splice', 'addEventListener', 'querySelector', 'querySelectorAll', 'getElementById', 'then', 'catch'];
            if (!jsKeywords.includes(funcName) && !declaredFunctions.has(funcName)) {
                calledFunctions.add(funcName);
            }
        }

        return {
            declaredFunctions: Array.from(declaredFunctions),
            calledFunctions: Array.from(calledFunctions)
        };
    },

    /**
     * Menjalankan analisis silang (cross-reference) antar-file untuk mendeteksi ketidaksinkronan
     */
    runCrossAnalysis() {
        if (this.loadedFiles.length === 0) {
            if (typeof window.showToast === 'function') {
                window.showToast('Unggah minimal 2 berkas JS dari PC terlebih dahulu untuk dianalisis!', 'error');
            }
            return;
        }

        this.parsedResults = [];
        this.desyncLogs = [];

        // Step 1: Parse seluruh file yang dimuat
        this.loadedFiles.forEach(file => {
            const parsed = this.parseJSContent(file.content);
            this.parsedResults.push({
                fileName: file.name,
                declaredFunctions: parsed.declaredFunctions,
                calledFunctions: parsed.calledFunctions
            });
        });

        // Step 2: Kumpulkan seluruh deklarasi global
        const globalDeclarations = new Map(); // functionName -> fileName
        this.parsedResults.forEach(res => {
            res.declaredFunctions.forEach(func => {
                globalDeclarations.set(func, res.fileName);
            });
        });

        // Step 3: Cocokkan pemanggilan fungsi antar-file
        this.parsedResults.forEach(callerFile => {
            callerFile.calledFunctions.forEach(calledFunc => {
                // Cek apakah fungsi dipanggil tetapi tidak dideklarasikan di file mana pun yang diunggah
                if (!globalDeclarations.has(calledFunc)) {
                    this.desyncLogs.push({
                        type: 'MISSING_FUNCTION',
                        sourceFile: callerFile.fileName,
                        targetFunction: calledFunc,
                        description: `Fungsi [${calledFunc}()] dipanggil di file "${callerFile.fileName}", namun tidak ditemukan deklarasi kodenya di file apa pun yang diunggah.`
                    });
                }
            });
        });

        // Step 4: Simpan hasil analisis ke LocalStorage & perbarui Flow Auditor + Error Tracker
        this.syncWithSystemModules();
    },

    /**
     * Menghubungkan temuan desinkronisasi ke LocalStorage, Flow Auditor, dan Error Tracker
     */
    syncWithSystemModules() {
        if (!window.StorageEngine) return;

        const data = window.StorageEngine.getData();
        const fileTree = data.fileTree || [];

        // Perbarui status berkas di fileTree jika terdeteksi error
        this.desyncLogs.forEach(log => {
            const targetFile = fileTree.find(f => f.fileName.toLowerCase() === log.sourceFile.toLowerCase());
            if (targetFile) {
                targetFile.status = 'Error/Need Fix';
            }

            // Tambahkan ke log Error Tracker jika belum ada
            if (data.errorLogs) {
                const isLogged = data.errorLogs.some(e => e.errorDescription.includes(log.targetFunction) && e.errorDescription.includes(log.sourceFile));
                if (!isLogged) {
                    data.errorLogs.push({
                        id: 'err-inspector-' + Date.now() + Math.random().toString(36).substr(2, 4),
                        fileTarget: targetFile ? targetFile.id : log.sourceFile,
                        severity: 'High',
                        errorDescription: `[Auto Desync Detector] ${log.description}`,
                        status: 'Open',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        // Simpan state analisis di StorageEngine
        if (typeof window.StorageEngine.saveCodeAnalysisResult === 'function') {
            window.StorageEngine.saveCodeAnalysisResult({
                uploadedFiles: this.loadedFiles.map(f => ({ name: f.name, size: f.size })),
                extractedFunctions: this.parsedResults,
                desyncLogs: this.desyncLogs
            });
        } else {
            window.StorageEngine.saveData(data);
        }

        // Trigger ulang Flow Auditor untuk memicu garis MERAH BERKEDIP
        if (window.FlowAuditorModule && typeof window.FlowAuditorModule.render === 'function') {
            window.FlowAuditorModule.render();
        }

        // Tampilkan ulasan Toast
        if (this.desyncLogs.length > 0) {
            if (typeof window.showToast === 'function') {
                window.showToast(`Audit Selesai: Terdeteksi ${this.desyncLogs.length} ketidaksinkronan kode! Garis merah diaktifkan.`, 'error');
            }
        } else {
            if (typeof window.showToast === 'function') {
                window.showToast('Audit Selesai: Seluruh koneksi fungsi antar-file terverifikasi SINKRON & AMAN!', 'success');
            }
        }

        this.renderAnalysisUI();
    },

    /**
     * Memperbarui antarmuka ringkasan berkas yang telah diunggah
     */
    updateUploadedUI() {
        const listEl = document.getElementById('inspector-file-list');
        if (!listEl) return;

        if (this.loadedFiles.length === 0) {
            listEl.innerHTML = `<span class="text-slate-500 italic text-xs">Belum ada berkas JS yang diunggah.</span>`;
            return;
        }

        listEl.innerHTML = this.loadedFiles.map(f => `
            <div class="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                <span class="text-sky-400 font-bold truncate"><i class="fa-regular fa-file-code mr-1.5"></i>${f.name}</span>
                <span class="text-[10px] text-slate-500">${(f.size / 1024).toFixed(1)} KB</span>
            </div>
        `).join('');
    },

    /**
     * Menampilkan hasil temuan desinkronisasi pada panel UI
     */
    renderAnalysisUI() {
        const outputEl = document.getElementById('inspector-results-output');
        if (!outputEl) return;

        if (this.desyncLogs.length === 0) {
            outputEl.innerHTML = `
                <div class="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-mono text-xs flex items-center space-x-3">
                    <i class="fa-solid fa-circle-check text-xl text-emerald-400"></i>
                    <div>
                        <span class="font-bold uppercase block">ANALISIS KODE SINKRON</span>
                        <span>Seluruh pemanggilan fungsi cocok dengan deklarasi antar-file yang diunggah. Tidak ditemukan nama yang tidak sesuai atau missing dependency.</span>
                    </div>
                </div>
            `;
            return;
        }

        outputEl.innerHTML = `
            <div class="space-y-3 font-mono text-xs">
                <div class="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 flex items-center justify-between">
                    <span class="font-bold uppercase flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation text-rose-400 animate-pulse"></i>
                        DESINCRONIZATION DETECTED (${this.desyncLogs.length} ANOMALIES)
                    </span>
                    <span class="text-[10px] bg-rose-900/80 px-2 py-0.5 rounded border border-rose-700">RED ALERT ACTIVATED</span>
                </div>
                ${this.desyncLogs.map(log => `
                    <div class="p-3 rounded-lg bg-slate-900 border border-rose-900/60 space-y-1">
                        <div class="flex items-center justify-between text-rose-400 font-bold">
                            <span>[${log.type}] ${log.sourceFile}</span>
                            <span class="text-[10px] text-amber-400">Target: ${log.targetFunction}()</span>
                        </div>
                        <p class="text-slate-300 text-[11px] leading-relaxed">${log.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

window.CodeInspectorModule = CodeInspectorModule;
