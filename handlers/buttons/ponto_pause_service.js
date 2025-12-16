const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');
const { updatePontoLog } = require('../../utils/pontoLogManager.js');
const { managePontoRole } = require('../../utils/pontoRoleManager.js'); // <--- NOVO

module.exports = {
    customId: 'ponto_pause_service',
    async execute(interaction) {
        // CORREÇÃO: Adicionado deferReply para evitar erro de interação
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND (status = 'OPEN' OR status IS NULL)
        `, [userId, guildId]);

        // CORREÇÃO: Alterado reply para editReply
        if (result.rows.length === 0) return interaction.editReply({ content: "Erro: Sessão não encontrada." }); // flags desnecessária no editReply
        
        const session = result.rows[0];
        
        // CORREÇÃO: Alterado reply para editReply
        if (session.is_paused) return interaction.editReply({ content: "Já pausado." });

        const now = new Date();

        await db.query(`
            UPDATE ponto_sessions SET is_paused = TRUE, last_pause_time = $1 WHERE session_id = $2
        `, [now, session.session_id]);

        const updatedResult = await db.query('SELECT * FROM ponto_sessions WHERE session_id = $1', [session.session_id]);
        const updatedSession = updatedResult.rows[0];
        
        // --- AÇÕES ---
        await updatePontoLog(interaction.client, updatedSession, interaction.user);
        await managePontoRole(interaction.client, guildId, userId, 'REMOVE'); // <--- REMOVER CARGO
        
        const ui = pontoDashboard(updatedSession, interaction.member);
        
        // CORREÇÃO: Variável corrigida de 'dashboard' para 'ui' (definida acima) e uso de editReply
        await interaction.editReply(ui);
    }
};