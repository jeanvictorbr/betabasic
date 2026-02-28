const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');
const { managePontoRole } = require('../../utils/pontoRoleManager.js'); // <--- NOVO

module.exports = {
    customId: 'ponto_start_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const now = new Date();

        const check = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND (status = 'OPEN' OR status IS NULL)
        `, [userId, guildId]);

        if (check.rows.length > 0) {
            const dashboard = pontoDashboard(check.rows[0], interaction.member);
            
            try {
                // Tenta mandar o painel na DM
                await interaction.user.send({ ...dashboard, content: '📋 Aqui está o painel do seu serviço que já estava ativo:' });
                return interaction.reply({ content: '✅ Você já possui um serviço ativo! Enviei o seu painel de controle no seu privado (DM).', ephemeral: true });
            } catch (err) {
                // Se a DM do usuário estiver fechada, manda efêmero no chat mesmo (Fallback)
                return interaction.reply({ ...dashboard, content: '❌ **Aviso:** Sua DM está fechada! Aqui está o painel do seu serviço ativo:', ephemeral: true });
            }
        }

        const result = await db.query(`
            INSERT INTO ponto_sessions (user_id, guild_id, start_time, status, is_paused, total_paused_ms)
            VALUES ($1, $2, $3, 'OPEN', false, 0)
            RETURNING *;
        `, [userId, guildId, now]);

        const session = result.rows[0];

        // --- AÇÕES ---
        updatePontoLog(interaction.client, session, interaction.user);
        managePontoRole(interaction.client, guildId, userId, 'ADD'); // <--- DAR CARGO

        const dashboard = pontoDashboard(session, interaction.member);
        
        try {
            // Tenta mandar o painel completão na DM na hora que inicia
            await interaction.user.send({ ...dashboard, content: '🚀 **Seu turno foi iniciado!** Aqui está o seu painel de controle:' });
            
            // Avisa no chat que deu certo
            await interaction.reply({ content: '✅ Serviço iniciado com sucesso!\nO seu **Painel de Controle** foi enviado no meu privado (DM) para você gerenciar o turno sem poluir o chat.', ephemeral: true });
        } catch (err) {
            // Se a DM estiver fechada, não quebra o bot, só manda no canal efêmero
            await interaction.reply({ ...dashboard, content: '✅ Serviço iniciado com sucesso!\n⚠️ **Aviso:** Como sua DM está fechada, enviei o painel aqui no chat mesmo. Recomendo abrir a DM nas configurações de privacidade!\n', ephemeral: true });
        }
    }
};