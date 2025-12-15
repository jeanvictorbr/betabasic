const db = require('../../database.js');
const pontoDashboard = require('../../ui/pontoDashboardPessoalV2.js');

module.exports = {
    customId: 'ponto_start_service',
    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const now = new Date(); // Objeto Data nativo

        // 1. Verifica se já existe sessão aberta
        const check = await db.query(`
            SELECT * FROM ponto_sessions 
            WHERE user_id = $1 AND guild_id = $2 AND (status = 'OPEN' OR status IS NULL)
        `, [userId, guildId]);

        if (check.rows.length > 0) {
            // Se já tem, mostra o painel dela
            return interaction.reply(pontoDashboard(check.rows[0], interaction.member));
        }

        // 2. Cria nova sessão (GARANTINDO status='OPEN' e start_time correto)
        // Usamos now.toISOString() para garantir formato string compatível se o driver falhar com objeto
        const result = await db.query(`
            INSERT INTO ponto_sessions (user_id, guild_id, start_time, status, is_paused, total_paused_ms)
            VALUES ($1, $2, $3, 'OPEN', false, 0)
            RETURNING *;
        `, [userId, guildId, now]);

        const session = result.rows[0];

        // 3. Responde com o painel V2
        // Nota: O reply DEVE ser sem 'ephemeral' se você quiser que outros vejam, 
        // mas o padrão V2 geralmente é ephemeral para painel de controle.
        const dashboard = pontoDashboard(session, interaction.member);
        await interaction.reply(dashboard);
    }
};