const db = require('../../database.js');
const { calculateSessionTime } = require('../../utils/pontoUtils.js');

module.exports = {
    customId: 'ponto_end_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // 1. Busca a sessão aberta usando user_id e guild_id
        // IMPORTANTE: Verifica se status é 'OPEN' ou NULL (caso antigo)
        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND (status = 'OPEN' OR status IS NULL)
        `, [userId, guildId]);

        if (result.rows.length === 0) {
            // Se não achou, remove a mensagem antiga para limpar a tela do usuário
            return interaction.update({ 
                content: "❌ Nenhuma sessão ativa encontrada. (Pode já ter sido finalizada)", 
                embeds: [], 
                components: [] 
            });
        }

        const session = result.rows[0];
        const now = new Date(); // Objeto Date para o Banco (TIMESTAMPTZ)
        
        // --- CÁLCULO FINAL DE PAUSA ---
        // Se o usuário clicou em finalizar enquanto estava "Pausado",
        // precisamos somar esse último intervalo de pausa ao total.
        
        let finalTotalPause = parseInt(session.total_paused_ms || 0);
        
        if (session.is_paused && session.last_pause_time) {
            const pauseStart = new Date(session.last_pause_time).getTime();
            const pauseEnd = now.getTime();
            const additionalPause = Math.max(0, pauseEnd - pauseStart);
            finalTotalPause += additionalPause;
        }

        // 2. ATUALIZAÇÃO NO BANCO (CRÍTICO: Usar session_id)
        try {
            await db.query(`
                UPDATE ponto_sessions 
                SET status = 'CLOSED', 
                    end_time = $1, 
                    is_paused = FALSE, 
                    total_paused_ms = $2
                WHERE session_id = $3
            `, [now, finalTotalPause, session.session_id]); // <--- session_id AQUI
        } catch (error) {
            console.error("Erro ao fechar ponto:", error);
            return interaction.reply({ content: "❌ Erro ao salvar no banco de dados. Contate o suporte.", flags: 1 << 6 });
        }

        // 3. Prepara objeto para cálculo final de exibição
        // Atualizamos o objeto 'session' localmente para gerar o relatório correto sem buscar no DB de novo
        session.end_time = now;
        session.status = 'CLOSED';
        session.total_paused_ms = finalTotalPause;
        session.is_paused = false; 
        
        const timeData = calculateSessionTime(session);

        // 4. Resposta Visual Final (Remove botões)
        const finalEmbed = {
            title: "✅ Expediente Finalizado com Sucesso",
            color: 0xFF0000, // Vermelho
            thumbnail: { url: interaction.user.displayAvatarURL() },
            fields: [
                { name: "Usuário", value: `<@${userId}>`, inline: true },
                { name: "Tempo Total Trabalhado", value: `\`${timeData.formatted}\``, inline: true },
                { name: "Início", value: `<t:${timeData.startTimestamp}:f>`, inline: true },
                { name: "Fim", value: `<t:${Math.floor(now.getTime() / 1000)}:f>`, inline: true }
            ],
            footer: { text: `ID da Sessão: ${session.session_id}` },
            timestamp: now.toISOString()
        };

        // Usa update para substituir o painel interativo pelo relatório estático
        await interaction.update({
            embeds: [finalEmbed],
            components: [] // Remove todos os botões para impedir cliques futuros
        });
        
        // (Opcional) Enviar log para canal de logs se configurado
    }
};