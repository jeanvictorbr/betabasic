/**
 * Calcula o tempo líquido de uma sessão, descontando as pausas.
 * @param {Object} session Objeto da sessão vindo do DB
 * @returns {Object} { durationMs, hours, minutes, seconds }
 */
function calculateSessionTime(session) {
    const now = Date.now();
    let totalElapsed = 0;

    if (session.status === 'CLOSED' && session.end_time) {
        // Se já fechou, usa o end_time
        totalElapsed = parseInt(session.end_time) - parseInt(session.start_time);
    } else {
        // Se está aberto ou pausado
        // Se estiver pausado agora, o tempo parou de contar no last_pause_time
        // Se estiver trabalhando, o tempo é Agora
        const referenceTime = session.is_paused ? parseInt(session.last_pause_time) : now;
        totalElapsed = referenceTime - parseInt(session.start_time);
    }

    // Subtrai todo o tempo que ficou pausado no passado
    const liquidTime = totalElapsed - (parseInt(session.total_pause_duration) || 0);

    // Evitar negativos por dessincronia de relógio
    const finalTime = Math.max(0, liquidTime);

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