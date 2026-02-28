const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');

module.exports = {
    customId: 'ponto_resume_service',
    async execute(interaction) {
        const userId = interaction.user.id;

        const check = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND (status = 'OPEN' OR status IS NULL)
        `, [userId]);

        if (check.rows.length === 0) {
            return interaction.reply({ content: '❌ Nenhum serviço ativo encontrado.', ephemeral: true });
        }

        const session = check.rows[0];

        if (!session.is_paused) {
            return interaction.reply({ content: '⚠️ Seu serviço não está pausado.', ephemeral: true });
        }

        const now = new Date();
        const pauseTime = session.last_pause_time ? new Date(session.last_pause_time) : now;
        const pausedDuration = now.getTime() - pauseTime.getTime();
        
        const newTotalPaused = (session.total_paused_ms || 0) + pausedDuration;

        const updatedSessionRes = await db.query(`
            UPDATE ponto_sessions
            SET is_paused = false,
                last_pause_time = NULL,
                total_paused_ms = $1
            WHERE id = $2
            RETURNING *;
        `, [newTotalPaused, session.id]);

        const updatedSession = updatedSessionRes.rows[0];

        updatePontoLog(interaction.client, updatedSession, interaction.user);

        const dashboard = pontoDashboard(updatedSession, interaction.member || interaction.user);
        await interaction.update(dashboard);
    }
};