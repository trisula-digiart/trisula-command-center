/**
 * TRISULA COMMAND CENTER (TCC) v1.2 - Dashboard Metrics & Quick Actions
 * File: js/dashboard.js
 */
const DashboardModule = {
    renderDashboard() {
        const data = window.StorageEngine ? window.StorageEngine.getData() : {};
        const fileTree = data.fileTree || [];
        const errorLogs = data.errorLogs || [];

        const totalFiles = fileTree.length;
        const safeFiles = fileTree.filter(f => f.status === 'Safe & Tested').length;
        const openErrors = errorLogs.filter(e => e.status !== 'Resolved').length;

        const progressPercent = totalFiles > 0 ? Math.round((safeFiles / totalFiles) * 100) : 0;

        const progressBar = document.getElementById('dash-progress-bar');
        const progressText = document.getElementById('dash-progress-text');
        const safeSubText = document.getElementById('dash-safe-file-sub');

        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        if (progressText) progressText.textContent = `${progressPercent}%`;
        if (safeSubText) safeSubText.textContent = `${safeFiles} Safe & Tested`;

        const alertBox = document.getElementById('dash-error-alert');
        const alertMsg = document.getElementById('dash-error-alert-msg');

        if (openErrors > 0) {
            if (alertBox) alertBox.classList.remove('hidden');
            if (alertMsg) alertMsg.textContent = `Terdapat ${openErrors} bug/error aktif yang memerlukan isolasi dan perbaikan di Error Tracker.`;
        } else {
            if (alertBox) alertBox.classList.add('hidden');
        }
    }
};

window.DashboardModule = DashboardModule;