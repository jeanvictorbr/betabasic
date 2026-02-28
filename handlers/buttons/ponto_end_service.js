const db = require('../../database.js');
const { calculateSessionTime } = require('../../utils/pontoUtils.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');
const { managePontoRole } = require('../../utils/pontoRoleManager.js');

module.exports = {
    customId: 'ponto_end_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        // 🔴 REMOVIDO: const guildId = interaction.guild.id; (Para não dar crash na DM)

        // 1. Busca a sessão aberta (apenas pelo usuário)
        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND (status = 'OPEN' OR status IS NULL OR end_time IS NULL)
            ORDER BY session_id DESC LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) return interaction.update({ content: "❌ Sessão não encontrada.", embeds: [], components: [] });

        const session = result.rows[0];
        
        // 🔴 ADICIONADO: Resgata o servidor onde o cara bateu o ponto direto do banco!
        const guildId = session.guild_id; 
        
        const now = new Date();
        const nowMs = now.getTime();

        // 2. Calcula pausas pendentes
        let finalTotalPause = parseInt(session.total_paused_ms || 0);
        if (session.is_paused && session.last_pause_time) {
            const lastPauseMs = new Date(session.last_pause_time).getTime();
            if (!isNaN(lastPauseMs)) finalTotalPause += Math.max(0, nowMs - lastPauseMs);
        }

        // 3. Atualiza a tabela de Sessões
        await db.query(`
            UPDATE ponto_sessions SET status = 'CLOSED', end_time = $1, is_paused = FALSE, total_paused_ms = $2 WHERE session_id = $3
        `, [now, finalTotalPause, session.session_id]);

        // Atualiza objeto local
        session.end_time = now;
        session.status = 'CLOSED';
        session.total_paused_ms = finalTotalPause;
        session.is_paused = false;

        // 4. Calcula o tempo usando seu Utils
        const timeData = calculateSessionTime(session);

        // ====================================================================================
        // CORREÇÃO: Usando 'total_ms' e 'ponto_leaderboard'
        // ====================================================================================
        if (timeData.durationMs > 0) {
            await db.query(`
                INSERT INTO ponto_leaderboard (user_id, guild_id, total_ms)
                VALUES ($1, $2, $3)
                ON CONFLICT (guild_id, user_id) 
                DO UPDATE SET total_ms = ponto_leaderboard.total_ms + $3
            `, [userId, guildId, timeData.durationMs]);
        }
        // ====================================================================================

        // --- AÇÕES ---
        updatePontoLog(interaction.client, session, interaction.user);
        managePontoRole(interaction.client, guildId, userId, 'REMOVE'); 

        const finalEmbed = {
            title: "✅ Expediente Finalizado",
            color: 0xFF0000,
            thumbnail: { url: interaction.user.displayAvatarURL() },
            fields: [
                { name: "Usuário", value: `<@${userId}>`, inline: true },
                { name: "Tempo Total", value: `\`${timeData.formatted}\``, inline: true },
                { name: "Fim", value: `<t:${Math.floor(nowMs / 1000)}:f>`, inline: true }
            ],
            footer: { text: `Sessão #${session.session_id} encerrada e salva no ranking.` }
        };

        await interaction.update({ embeds: [finalEmbed], components: [] });
    }
};