/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - Flow Auditor & Visual Sync Inspector Engine
 * File: js/flowAuditor.js
 * Engine: TRISULACODER v10.2
 * Architecture: Standalone ES6 Visual Diagram & Canvas Manager
 */

const FlowAuditorModule = {
    // Canvas State & Dragging Controllers
    draggingNodeId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,

    /**
     * Utama: Inisialisasi dan rendering ulang seluruh canvas Flow Auditor
     */
    render() {
        if (!window.StorageEngine) {
            console.error('[FlowAuditorModule Error]: StorageEngine required!');
            return;
        }

        const data = window.StorageEngine.getData();
        const flowData = data.flowAuditor || { nodes: [], connections: [] };

        this.renderNodes(flowData.nodes);
        this.renderConnections(flowData.nodes, flowData.connections);
        this.bindDragEvents();
    },

    /**
     * Membuat dan memasukkan elemen HTML Node ke dalam container canvas
     * @param {Array} nodes - Daftar node modul
     */
    renderNodes(nodes) {
        const container = document.getElementById('nodes-container');
        if (!container) return;

        container.innerHTML = nodes.map(n => `
            <div id="${n.id}" class="flow-node-box bg-panelBg border-2 border-sky-500/80 rounded-lg p-3 w-64 shadow-xl text-xs" style="left:${n.x}px; top:${n.y}px;">
                <div class="font-bold text-white bg-sky-950/80 p-1.5 rounded border border-sky-800 flex items-center justify-between">
                    <span>${n.label}</span>
                    <i class="fa-solid fa-grip-vertical text-sky-400 cursor-grab"></i>
                </div>
                ${n.subtext ? `<div class="mt-2 p-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 font-mono">${n.subtext}</div>` : ''}
            </div>
        `).join('');
    },

    /**
     * Menghitung kurva Bézier SVG untuk menghubungkan node dan mendeteksi anomali
     * @param {Array} nodes - Daftar node
     * @param {Array} connections - Connection pairs
     * @param {boolean} forceCheck - Flag paksa status error untuk audit
     */
    renderConnections(nodes, connections, forceCheck = false) {
        const svg = document.getElementById('svg-canvas');
        if (!svg) return;

        const data = window.StorageEngine ? window.StorageEngine.getData() : {};
        const fileTree = data.fileTree || [];

        let svgContent = `
            <defs>
                <marker id="arrow-sky" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                </marker>
            </defs>
        `;

        svgContent += connections.map(c => {
            const fromNode = nodes.find(n => n.id === c.from);
            const toNode = nodes.find(n => n.id === c.to);
            if (!fromNode || !toNode) return '';

            // Cek apakah file target berhubungan dengan error
            const targetFile = fileTree.find(f => f.id === toNode.fileId);
            const isNodeInError = targetFile && targetFile.status === 'Error/Need Fix';
            const isError = forceCheck || isNodeInError;

            // Titik Awal (Kanan Node Asal) & Titik Akhir (Kiri Node Tujuan)
            const x1 = fromNode.x + 250;
            const y1 = fromNode.y + 35;
            const x2 = toNode.x;
            const y2 = toNode.y + 35;

            // Kalkulasi Lengkungan Bézier
            const dx = Math.abs(x2 - x1) / 2;
            const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return `<path d="${pathD}" class="edge-path ${isError ? 'error' : ''}" marker-end="url(#${isError ? 'arrow-red' : 'arrow-sky'})" />`;
        }).join('');

        svg.innerHTML = svgContent;
    },

    /**
     * Memasang Event Listener Drag-and-Drop pada Canvas
     */
    bindDragEvents() {
        const canvas = document.getElementById('flow-canvas');
        if (!canvas) return;

        canvas.onmousedown = (e) => {
            const nodeBox = e.target.closest('.flow-node-box');
            if (nodeBox) {
                this.draggingNodeId = nodeBox.id;
                const rect = nodeBox.getBoundingClientRect();
                this.dragOffsetX = e.clientX - rect.left;
                this.dragOffsetY = e.clientY - rect.top;
            }
        };

        canvas.onmousemove = (e) => {
            if (!this.draggingNodeId || !window.StorageEngine) return;
            
            const canvasRect = canvas.getBoundingClientRect();
            const x = e.clientX - canvasRect.left - this.dragOffsetX;
            const y = e.clientY - canvasRect.top - this.dragOffsetY;

            const data = window.StorageEngine.getData();
            const node = data.flowAuditor.nodes.find(n => n.id === this.draggingNodeId);
            
            if (node) {
                node.x = Math.max(10, Math.min(x, canvasRect.width - 260));
                node.y = Math.max(10, Math.min(y, canvasRect.height - 80));
                
                const nodeEl = document.getElementById(node.id);
                if (nodeEl) {
                    nodeEl.style.left = `${node.x}px`;
                    nodeEl.style.top = `${node.y}px`;
                }
                this.renderConnections(data.flowAuditor.nodes, data.flowAuditor.connections);
            }
        };

        canvas.onmouseup = () => {
            if (this.draggingNodeId && window.StorageEngine) {
                this.draggingNodeId = null;
                window.StorageEngine.saveData(window.StorageEngine.getData());
            }
        };
    },

    /**
     * Menjalankan Audit Sinkronisasi dan Mengaktifkan Indikator Garis Merah Berkedip
     */
    checkIntegrity() {
        if (!window.StorageEngine) return;
        const data = window.StorageEngine.getData();
        this.renderConnections(data.flowAuditor.nodes, data.flowAuditor.connections, true);
        
        if (typeof window.showToast === 'function') {
            window.showToast('Integrity Check Failed: Desinkronisasi data terdeteksi pada koneksi Data Supplier!', 'error');
        }
    },

    /**
     * Membuka Modal Dialog Tambah Node Modul Baru
     */
    openAddNodeModal() {
        const modal = document.getElementById('node-modal');
        const fileSelect = document.getElementById('modal-node-file');
        
        if (!modal || !window.StorageEngine) return;
        const data = window.StorageEngine.getData();

        if (fileSelect) {
            fileSelect.innerHTML = (data.fileTree || []).map(f => `<option value="${f.id}">${f.fileName} (${f.path})</option>`).join('');
        }

        modal.classList.remove('hidden');
    },

    /**
     * Mengembalikan diagram flow ke posisi default
     */
    resetCanvas() {
        if (!window.StorageEngine) return;
        window.StorageEngine.saveData(window.StorageEngine.DEFAULT_STATE);
        this.render();
        
        if (typeof window.showToast === 'function') {
            window.showToast('Alur diagram dikembalikan ke posisi default.', 'success');
        }
    }
};

window.FlowAuditorModule = FlowAuditorModule;
