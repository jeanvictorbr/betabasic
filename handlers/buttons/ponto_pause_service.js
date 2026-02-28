const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');

module.exports = {
    customId: 'ponto_pause_service',
    async execute(interaction) {
        const userId = interaction.user.id;

        // Bate no banco buscando APENAS pelo usuário (pois na DM não tem interaction.guild)
        const check = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND (status = 'OPEN' OR status IS NULL)
        `, [userId]);

        if (check.rows.length === 0) {
            return interaction.reply({ content: '❌ Nenhum serviço ativo encontrado para você.', ephemeral: true });
        }

        const session = check.rows[0];

        if (session.is_paused) {
            return interaction.reply({ content: '⚠️ Seu serviço já está pausado. Retome-o primeiro.', ephemeral: true });
        }

        const now = new Date();
        const updatedSessionRes = await db.query(`
            UPDATE ponto_sessions
            SET is_paused = true,
                last_pause_time = $1
            WHERE id = $2
            RETURNING *;
        `, [now, session.id]);

        const updatedSession = updatedSessionRes.rows[0];

        // Atualiza a Live Log do Dono lá no servidor
        updatePontoLog(interaction.client, updatedSession, interaction.user);

        // Atualiza o painel na tela/DM do cara
        const dashboard = pontoDashboard(updatedSession, interaction.member || interaction.user);
        await interaction.update(dashboard);
    }
};