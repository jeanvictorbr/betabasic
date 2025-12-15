const db = require('../../database.js');
const { calculateSessionTime } = require('../../utils/pontoUtils.js');

module.exports = {
    customId: 'ponto_end_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND (status = 'OPEN' OR status IS NULL)
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            return interaction.reply({ content: "❌ Você não tem um expediente aberto.", flags: 1 << 6 });
        }

        const session = result.rows[0];
        const now = new Date(); // Objeto Date para o banco
        const nowMs = now.getTime(); // Ms para calculo

        // Calcula pausa final se estiver pausado
        let finalTotalPause = parseInt(session.total_paused_ms || 0);
        
        if (session.is_paused && session.last_pause_time) {
            const lastPauseMs = new Date(session.last_pause_time).getTime();
            const currentPauseDuration = nowMs - lastPauseMs;
            finalTotalPause += currentPauseDuration;
        }

        // Fecha a sessão usando session_id
        await db.query(`
            UPDATE ponto_sessions 
            SET status = 'CLOSED', end_time = $1, is_paused = FALSE, total_paused_ms = $2
            WHERE session_id = $3
        `, [now, finalTotalPause, session.session_id]);

        // Simula objeto final para cálculo visual
        session.end_time = now;
        session.status = 'CLOSED';
        session.total_paused_ms = finalTotalPause;
        session.is_paused = false; // Força false para o cálculo considerar fechado
        
        const timeData = calculateSessionTime(session);

        const finalEmbed = {
            title: "✅ Expediente Finalizado",
            color: 0xFF0000,
            fields: [
                { name: "Usuário", value: `<@${userId}>`, inline: true },
                { name: "Tempo Total", value: `\`${timeData.formatted}\``, inline: true },
                { name: "Fim", value: `<t:${Math.floor(nowMs / 1000)}:f>`, inline: false }
            ],
            footer: { text: "Registro salvo com sucesso." }
        };

        await interaction.update({
            embeds: [finalEmbed],
            components: []
        });
        
        // (Opcional) Aqui você pode inserir na tabela de histórico ou logs
    }
};