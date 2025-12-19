// utils/progressBar.js
function createProgressBar(current, max, size = 10) {
    const progress = Math.round((current / max) * size);
    const emptyProgress = size - progress;

    const progressText = '▇'.repeat(progress);
    const emptyProgressText = '—'.repeat(emptyProgress);
    
    return `[${progressText}${emptyProgressText}]`;
}

module.exports = createProgressBar;