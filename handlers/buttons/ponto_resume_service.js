const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');

module.exports = {
    customId: 'ponto_resume_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND (status = 'OPEN' OR status IS NULL)
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            return interaction.reply({ content: "❌ Nenhuma sessão ativa encontrada.", flags: 1 << 6 });
        }

        const session = result.rows[0];

        if (!session.is_paused) {
            return interaction.reply({ content: "⚠️ Sua sessão não está pausada.", flags: 1 << 6 });
        }

        // Lógica de cálculo da pausa
        const now = Date.now();
        const lastPauseMs = session.last_pause_time ? new Date(session.last_pause_time).getTime() : now;
        
        // Proteção contra NaN
        const safeLastPause = isNaN(lastPauseMs) ? now : lastPauseMs;
        const pauseDuration = now - safeLastPause;
        
        const currentTotal = parseInt(session.total_paused_ms || 0);
        const newTotalPause = currentTotal + pauseDuration;

        // Atualiza DB
        await db.query(`
            UPDATE ponto_sessions 
            SET is_paused = FALSE, total_paused_ms = $1, last_pause_time = NULL
            WHERE session_id = $2
        `, [newTotalPause, session.session_id]);

        const updatedResult = await db.query('SELECT * FROM ponto_sessions WHERE session_id = $1', [session.session_id]);
        const updatedSession = updatedResult.rows[0];

        // Atualiza Log (Live Audit)
        updatePontoLog(interaction.client, updatedSession, interaction.user);

        // Atualiza Painel Pessoal
        const ui = pontoDashboard(updatedSession, interaction.member);
        await interaction.update(ui);
    }
};