const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');

module.exports = {
    customId: 'ponto_pause_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Buscar sessão aberta
        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND status = 'OPEN'
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            return interaction.reply({ content: "❌ Nenhuma sessão ativa encontrada.", flags: 1 << 6 });
        }

        const session = result.rows[0];

        if (session.is_paused) {
            return interaction.reply({ content: "⚠️ Sua sessão já está pausada.", flags: 1 << 6 });
        }

        // LÓGICA DE PAUSA: Apenas marcamos que pausou AGORA.
        // O tempo decorrido até agora será calculado dinamicamente no Utils.
        const now = Date.now();

        await db.query(`
            UPDATE ponto_sessions 
            SET is_paused = TRUE, last_pause_time = $1
            WHERE id = $2
        `, [now, session.id]);

        // Recupera sessão atualizada para mostrar na UI
        const updatedSession = await db.query('SELECT * FROM ponto_sessions WHERE id = $1', [session.id]);
        
        const ui = pontoDashboard(updatedSession.rows[0], interaction.member);
        await interaction.update(ui);
    }
};