const db = require('../../database.js');
const { generateRankingCard } = require('../../utils/rankingGenerator.js');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: (id) => id.startsWith('ponto_rank_page_'),
    
    async execute(interaction) {
        // Verificação de segurança
        if (interaction.replied || interaction.deferred) return;

        await interaction.deferUpdate();

        const requestedPage = parseInt(interaction.customId.split('_')[3]);
        const guildId = interaction.guild.id;
        const itemsPerPage = 10;
        
        if (isNaN(requestedPage) || requestedPage < 1) return;

        const offset = (requestedPage - 1) * itemsPerPage;

        // 1. Busca Dados
        const [rankingRes, countRes] = await Promise.all([
            db.query(`
                SELECT user_id, total_ms 
                FROM ponto_leaderboard 
                WHERE guild_id = $1 
                ORDER BY total_ms DESC 
                LIMIT $2 OFFSET $3
            `, [guildId, itemsPerPage, offset]),
            db.query(`SELECT COUNT(user_id) FROM ponto_leaderboard WHERE guild_id = $1`, [guildId])
        ]);

        const totalItems = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (requestedPage > totalPages && totalPages > 0) return;

        // 2. Prepara Dados (Fetch paralelo)
        const rankingData = [];
        let position = offset + 1;
        const userPromises = rankingRes.rows.map(row => interaction.client.users.fetch(row.user_id).catch(() => null));
        const users = await Promise.all(userPromises);

        for (let i = 0; i < rankingRes.rows.length; i++) {
            rankingData.push({
                user: users[i],
                total_ms: rankingRes.rows[i].total_ms,
                position: position++
            });
        }

        // 3. Gera Nova Imagem Premium
        const buffer = await generateRankingCard(interaction.guild, rankingData, requestedPage, totalPages);
        const attachment = new AttachmentBuilder(buffer, { name: 'ranking-premium.png' });

        // 4. Atualiza Botões
        const row = new ActionRowBuilder();
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`ponto_rank_page_${requestedPage - 1}`)
                .setLabel('◀')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(requestedPage <= 1),
            new ButtonBuilder()
                .setCustomId('ponto_rank_ignore')
                .setLabel(`Página ${requestedPage} de ${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`ponto_rank_page_${requestedPage + 1}`)
                .setLabel('▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(requestedPage >= totalPages)
        );

        await interaction.editReply({ 
            files: [attachment], 
            components: [row] 
        });
    }
};