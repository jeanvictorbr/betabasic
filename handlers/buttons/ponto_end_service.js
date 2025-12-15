const db = require('../../database.js');
const { calculateSessionTime } = require('../../utils/pontoUtils.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');

module.exports = {
    customId: 'ponto_end_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // 1. Busca Robusta (aceita NULL ou OPEN)
        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 
            AND guild_id = $2 
            AND (status = 'OPEN' OR status IS NULL OR end_time IS NULL)
            ORDER BY session_id DESC
            LIMIT 1
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            return interaction.update({ 
                content: "❌ Sessão não encontrada ou já finalizada.", 
                embeds: [], 
                components: [] 
            });
        }

        const session = result.rows[0];
        const now = new Date();
        const nowMs = now.getTime();

        // Cálculo de pausa final (se houver)
        let finalTotalPause = parseInt(session.total_paused_ms || 0);
        if (session.is_paused && session.last_pause_time) {
            const lastPauseMs = new Date(session.last_pause_time).getTime();
            if (!isNaN(lastPauseMs)) {
                finalTotalPause += Math.max(0, nowMs - lastPauseMs);
            }
        }

        // 2. Encerramento no DB
        await db.query(`
            UPDATE ponto_sessions 
            SET status = 'CLOSED', 
                end_time = $1, 
                is_paused = FALSE, 
                total_paused_ms = $2
            WHERE session_id = $3
        `, [now, finalTotalPause, session.session_id]);

        // 3. Atualiza objeto local para exibição correta
        session.end_time = now;
        session.status = 'CLOSED';
        session.total_paused_ms = finalTotalPause;
        session.is_paused = false;

        // --- ATUALIZA LOG (FINALIZA EM VERMELHO) ---
        updatePontoLog(interaction.client, session, interaction.user);

        const timeData = calculateSessionTime(session);

        const finalEmbed = {
            title: "✅ Expediente Finalizado",
            color: 0xFF0000,
            thumbnail: { url: interaction.user.displayAvatarURL() },
            fields: [
                { name: "Usuário", value: `<@${userId}>`, inline: true },
                { name: "Tempo Total", value: `\`${timeData.formatted}\``, inline: true },
                { name: "Início", value: `<t:${timeData.startTimestamp}:f>`, inline: true },
                { name: "Fim", value: `<t:${Math.floor(nowMs / 1000)}:f>`, inline: true }
            ],
            footer: { text: `Sessão #${session.session_id} encerrada.` },
            timestamp: now.toISOString()
        };

        await interaction.update({
            embeds: [finalEmbed],
            components: [] // Remove botões
        });
    }
};