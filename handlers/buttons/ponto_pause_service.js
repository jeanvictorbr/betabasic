const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');

module.exports = {
    customId: 'ponto_pause_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // CORREÇÃO: Usando 'session_id' na query
        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND (status = 'OPEN' OR status IS NULL)
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            return interaction.reply({ content: "❌ Nenhuma sessão ativa encontrada.", flags: 1 << 6 });
        }

        const session = result.rows[0];

        if (session.is_paused) {
            return interaction.reply({ content: "⚠️ Sua sessão já está pausada.", flags: 1 << 6 });
        }

        // Para TIMESTAMPTZ, usamos o objeto Date ou string ISO
        const now = new Date(); 

        // CORREÇÃO: Usando 'session_id' no WHERE
        await db.query(`
            UPDATE ponto_sessions 
            SET is_paused = TRUE, last_pause_time = $1
            WHERE session_id = $2
        `, [now, session.session_id]);

        // Recupera atualizado para a UI
        const updatedSession = await db.query('SELECT * FROM ponto_sessions WHERE session_id = $1', [session.session_id]);
        
        const ui = pontoDashboard(updatedSession.rows[0], interaction.member);
        await interaction.update(ui);
    }
};