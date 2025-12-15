/**
 * Calcula o tempo líquido de uma sessão, compatível com TIMESTAMPTZ e BIGINT.
 * @param {Object} session Objeto da sessão vindo do DB
 * @returns {Object} { durationMs, hours, minutes, seconds, formatted }
 */
function calculateSessionTime(session) {
    const now = Date.now();
    let totalElapsed = 0;

    // Função auxiliar para converter qualquer entrada de data em Timestamp (ms)
    const parseTime = (val) => {
        if (!val) return 0;
        if (val instanceof Date) return val.getTime(); // Se for objeto Date do JS
        return parseInt(val); // Se for string/number (timestamp unix)
    };

    const startTimeMs = parseTime(session.start_time);
    const lastPauseTimeMs = parseTime(session.last_pause_time);
    const endTimeMs = parseTime(session.end_time);
    
    // Converte total_paused_ms (que vem como string do banco se for BIGINT)
    const totalPausedVal = parseInt(session.total_paused_ms || session.total_pause_duration || 0);

    if (session.status === 'CLOSED' && endTimeMs > 0) {
        // Se já fechou
        totalElapsed = endTimeMs - startTimeMs;
    } else {
        // Se está aberto
        const referenceTime = session.is_paused ? lastPauseTimeMs : now;
        
        // Proteção contra inconsistências de data
        if (referenceTime < startTimeMs) {
            totalElapsed = 0;
        } else {
            totalElapsed = referenceTime - startTimeMs;
        }
    }

    // Tempo Líquido = Tempo Decorrido - Tempo Pausado
    const liquidTime = totalElapsed - totalPausedVal;

    // Evitar negativos (NaN ou < 0)
    const finalTime = Math.max(0, isNaN(liquidTime) ? 0 : liquidTime);

    const seconds = Math.floor((finalTime / 1000) % 60);
    const minutes = Math.floor((finalTime / (1000 * 60)) % 60);
    const hours = Math.floor((finalTime / (1000 * 60 * 60)));

    return {
        durationMs: finalTime,
        hours,
        minutes,
        seconds,
        formatted: `${hours}h ${minutes}m ${seconds}s`
    };
}

module.exports = { calculateSessionTime };