const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');
const { managePontoRole } = require('../../utils/pontoRoleManager.js');

module.exports = {
    customId: 'ponto_end_service',
    async execute(interaction) {
        const userId = interaction.user.id;

        // Busca o serviço só pelo usuário
        const check = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND (status = 'OPEN' OR status IS NULL)
        `, [userId]);

        if (check.rows.length === 0) {
            return interaction.reply({ content: '❌ Você não tem nenhum serviço ativo para encerrar.', ephemeral: true });
        }

        const session = check.rows[0];
        const now = new Date();
        const guildId = session.guild_id; // Resgata o servidor verdadeiro de onde ele bateu o ponto!

        let newTotalPaused = session.total_paused_ms || 0;
        if (session.is_paused && session.last_pause_time) {
            const pauseTime = new Date(session.last_pause_time);
            newTotalPaused += (now.getTime() - pauseTime.getTime());
        }

        const updatedSessionRes = await db.query(`
            UPDATE ponto_sessions
            SET status = 'CLOSED',
                end_time = $1,
                is_paused = false,
                total_paused_ms = $2
            WHERE id = $3
            RETURNING *;
        `, [now, newTotalPaused, session.id]);

        const updatedSession = updatedSessionRes.rows[0];

        // Atualiza Logs e tira o cargo do funcionário lá no servidor
        updatePontoLog(interaction.client, updatedSession, interaction.user);
        managePontoRole(interaction.client, guildId, userId, 'REMOVE'); 

        // Como finalizou, atualizamos o painel apagando os botões pra ele não clicar de novo
        const finalDashboard = pontoDashboard(updatedSession, interaction.member || interaction.user);
        
        await interaction.update({ 
            content: '✅ **Serviço Finalizado com Sucesso!** Excelente trabalho.',
            embeds: finalDashboard.embeds,
            components: [] // Remove os botões de Pausar/Finalizar
        });
    }
};