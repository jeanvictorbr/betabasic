const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');
const { managePontoRole } = require('../../utils/pontoRoleManager.js'); // <--- NOVO

module.exports = {
    customId: 'ponto_resume_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        // 🔴 REMOVIDO: const guildId = interaction.guild.id;

        // Busca a sessão apenas pelo ID do usuário
        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND (status = 'OPEN' OR status IS NULL)
            ORDER BY session_id DESC LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) return interaction.reply({ content: "Erro: Nenhuma sessão encontrada.", flags: 1<<6 });
        
        const session = result.rows[0];

        // 🔴 ADICIONADO: Resgata o servidor onde o cara bateu o ponto direto do banco!
        const guildId = session.guild_id;

        if (!session.is_paused) return interaction.reply({ content: "Não está pausado.", flags: 1<<6 });

        const now = Date.now();
        const lastPauseMs = session.last_pause_time ? new Date(session.last_pause_time).getTime() : now;
        const safeLastPause = isNaN(lastPauseMs) ? now : lastPauseMs;
        const pauseDuration = now - safeLastPause;
        const newTotalPause = parseInt(session.total_paused_ms || 0) + pauseDuration;

        await db.query(`
            UPDATE ponto_sessions SET is_paused = FALSE, total_paused_ms = $1, last_pause_time = NULL WHERE session_id = $2
        `, [newTotalPause, session.session_id]);

        const updatedResult = await db.query('SELECT * FROM ponto_sessions WHERE session_id = $1', [session.session_id]);
        const updatedSession = updatedResult.rows[0];

        // --- AÇÕES ---
        updatePontoLog(interaction.client, updatedSession, interaction.user);
        managePontoRole(interaction.client, guildId, userId, 'ADD'); // <--- DEVOLVER CARGO

        // 🔴 ADICIONADO FALLBACK: Se for na DM, usa interaction.user no lugar de member
        const ui = pontoDashboard(updatedSession, interaction.member || interaction.user);
        await interaction.update(ui);
    }
};