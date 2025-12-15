const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');

module.exports = {
    customId: 'ponto_resume_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND status = 'OPEN'
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            return interaction.reply({ content: "❌ Nenhuma sessão ativa encontrada.", flags: 1 << 6 });
        }

        const session = result.rows[0];

        if (!session.is_paused) {
            return interaction.reply({ content: "⚠️ Sua sessão não está pausada.", flags: 1 << 6 });
        }

        // LÓGICA DE RETOMADA:
        // 1. Calculamos quanto tempo ficou parado (Agora - last_pause_time)
        // 2. Adicionamos isso ao acumulador total_pause_duration
        // 3. Tiramos o flag de is_paused
        
        const now = Date.now();
        const pauseDuration = now - parseInt(session.last_pause_time);
        const newTotalPause = parseInt(session.total_pause_duration || 0) + pauseDuration;

        await db.query(`
            UPDATE ponto_sessions 
            SET is_paused = FALSE, total_pause_duration = $1, last_pause_time = 0
            WHERE id = $2
        `, [newTotalPause, session.id]);

        const updatedSession = await db.query('SELECT * FROM ponto_sessions WHERE id = $1', [session.id]);
        
        const ui = pontoDashboard(updatedSession.rows[0], interaction.member);
        await interaction.update(ui);
    }
};