const db = require('../../database.js');
const { calculateSessionTime } = require('../../utils/pontoUtils.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');
const { managePontoRole } = require('../../utils/pontoRoleManager.js');

module.exports = {
    customId: 'ponto_end_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // 1. Busca a sessão ativa (mesmo se estiver bugada/sem status)
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

        // 2. Cálculo Final de Pausa (se fechou enquanto estava pausado)
        let finalTotalPause = parseInt(session.total_paused_ms || 0);
        
        // Verifica se estava pausado e se last_pause_time é válido
        if (session.is_paused && session.last_pause_time) {
            const lastPauseMs = new Date(session.last_pause_time).getTime();
            // Só soma se lastPauseMs for válido e menor que agora
            if (!isNaN(lastPauseMs) && lastPauseMs > 0 && lastPauseMs < nowMs) {
                finalTotalPause += (nowMs - lastPauseMs);
            }
        }

        // 3. Atualiza a Sessão no Banco (Fecha ela)
        await db.query(`
            UPDATE ponto_sessions 
            SET status = 'CLOSED', 
                end_time = $1, 
                is_paused = FALSE, 
                total_paused_ms = $2
            WHERE session_id = $3
        `, [now, finalTotalPause, session.session_id]);

        // 4. Atualiza objeto local para cálculos
        session.end_time = now;
        session.status = 'CLOSED';
        session.total_paused_ms = finalTotalPause;
        session.is_paused = false;

        // Calcula o tempo líquido final
        const timeData = calculateSessionTime(session);
        const durationMs = timeData.durationMs; // Tempo exato em milissegundos

        // ---------------------------------------------------------
        // 🚀 A CORREÇÃO DO RANKING ESTÁ AQUI (UPSERT)
        // ---------------------------------------------------------
        if (durationMs > 0) {
            await db.query(`
                INSERT INTO ponto_leaderboard (guild_id, user_id, total_ms)
                VALUES ($1, $2, $3)
                ON CONFLICT (guild_id, user_id) 
                DO UPDATE SET total_ms = ponto_leaderboard.total_ms + $3
            `, [guildId, userId, durationMs]);
            
            console.log(`[Ranking] Adicionado ${timeData.formatted} para ${userId}`);
        }

        // 5. Ações Finais (Logs, Cargos, Interface)
        updatePontoLog(interaction.client, session, interaction.user);
        managePontoRole(interaction.client, guildId, userId, 'REMOVE');

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
            footer: { text: `Sessão #${session.session_id} salva e computada no Ranking.` },
            timestamp: now.toISOString()
        };

        await interaction.update({
            embeds: [finalEmbed],
            components: [] 
        });
    }
};