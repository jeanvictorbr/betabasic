const db = require('../../database.js');
const { calculateSessionTime } = require('../../utils/pontoUtils.js');

module.exports = {
    customId: 'ponto_end_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND status = 'OPEN'
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            return interaction.reply({ content: "❌ Você não tem um expediente aberto.", flags: 1 << 6 });
        }

        const session = result.rows[0];
        const now = Date.now();

        // Se estava pausado ao encerrar, precisamos computar a pausa final até agora
        let finalTotalPause = parseInt(session.total_pause_duration || 0);
        if (session.is_paused) {
            const currentPauseDuration = now - parseInt(session.last_pause_time);
            finalTotalPause += currentPauseDuration;
        }

        // Fecha a sessão
        await db.query(`
            UPDATE ponto_sessions 
            SET status = 'CLOSED', end_time = $1, is_paused = FALSE, total_pause_duration = $2
            WHERE id = $3
        `, [now, finalTotalPause, session.id]);

        // Pega os dados finais para cálculo
        session.end_time = now;
        session.status = 'CLOSED';
        session.total_pause_duration = finalTotalPause;
        
        const timeData = calculateSessionTime(session);

        // UI de Relatório Final (Resposta v2 type 17 não suporta embed update em reply normal, então fazemos editReply ou novo update)
        // Aqui vamos atualizar o painel para mostrar que fechou
        
        const finalEmbed = {
            title: "✅ Expediente Finalizado",
            color: 0xFF0000, // Vermelho
            fields: [
                { name: "Usuário", value: `<@${userId}>`, inline: true },
                { name: "Tempo Total", value: `\`${timeData.formatted}\``, inline: true },
                { name: "Fim", value: `<t:${Math.floor(now / 1000)}:f>`, inline: false }
            ],
            footer: { text: "Registro salvo com sucesso." }
        };

        // Atualiza a mensagem original do painel para "Encerrado" e remove botões
        await interaction.update({
            embeds: [finalEmbed],
            components: [] // Remove botões
        });

        // Opcional: Enviar log para canal de logs se configurado (pode ser implementado depois)
    }
};