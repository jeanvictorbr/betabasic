const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');

module.exports = {
    customId: 'ponto_meu_status',
    async execute(interaction) {
        const userId = interaction.user.id;
        // 🔴 REMOVIDO: const guildId = interaction.guild.id; (Para não quebrar na DM)

        // Busca a sessão ativa usando apenas o ID do usuário, pois na DM não tem servidor
        const result = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND (status = 'OPEN' OR status IS NULL)
            ORDER BY session_id DESC LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            return interaction.reply({ content: "❌ Nenhuma sessão ativa encontrada.", flags: 1 << 6 }); // flags: 64 = ephemeral
        }

        // 🔴 ADICIONADO FALLBACK: Usa interaction.user se interaction.member não existir (na DM)
        const ui = pontoDashboard(result.rows[0], interaction.member || interaction.user);
        
        await interaction.update(ui);
    }
};