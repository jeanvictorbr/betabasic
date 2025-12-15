/**
 * utils/pontoUtils.js
 * Utilitário central para cálculos de tempo do Ponto.
 */

// Função auxiliar para garantir timestamp em milissegundos
function parseToMs(value) {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string') return new Date(value).getTime();
    return Number(value); // Já é numero (timestamp)
}

function calculateSessionTime(session) {
    const now = Date.now();
    
    // Converte tudo para Milissegundos
    const startTimeMs = parseToMs(session.start_time);
    const lastPauseMs = parseToMs(session.last_pause_time);
    const endTimeMs = parseToMs(session.end_time);
    const totalPausedMs = parseInt(session.total_paused_ms || session.total_pause_duration || 0);

    let totalElapsed = 0;

    if (session.status === 'CLOSED' && endTimeMs > 0) {
        // Sessão fechada: Fim - Início
        totalElapsed = endTimeMs - startTimeMs;
    } else {
        // Sessão aberta
        if (session.is_paused) {
            // Se está pausado, o tempo parou de contar no momento da pausa (lastPauseMs)
            // Se lastPauseMs for inválido (0), usa o Agora como fallback para não quebrar
            const stopPoint = lastPauseMs > 0 ? lastPauseMs : now;
            totalElapsed = stopPoint - startTimeMs;
        } else {
            // Se está rodando, é Agora - Início
            totalElapsed = now - startTimeMs;
        }
    }

    // Subtrai o total de pausas acumuladas
    const liquidTime = totalElapsed - totalPausedMs;

    // Evita números negativos ou NaN
    const finalTime = Math.max(0, isNaN(liquidTime) ? 0 : liquidTime);

    const seconds = Math.floor((finalTime / 1000) % 60);
    const minutes = Math.floor((finalTime / (1000 * 60)) % 60);
    const hours = Math.floor((finalTime / (1000 * 60 * 60)));

    // Formata HH:MM:SS
    const pad = (n) => n.toString().padStart(2, '0');
    const formatted = `${hours}h ${minutes}m ${seconds}s`; // Ex: 1h 05m 09s

    return {
        durationMs: finalTime,
        hours,
        minutes,
        seconds,
        formatted,
        startTimestamp: Math.floor(startTimeMs / 1000) // Retorna segundos para o Discord <t:X:f>
    };
}

module.exports = { calculateSessionTime };