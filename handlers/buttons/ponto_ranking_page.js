const db = require('../../database.js');
const { generateRankingCard } = require('../../utils/rankingGenerator.js');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    // Detecta qualquer ID que comece com 'ponto_rank_page_'
    customId: (id) => id.startsWith('ponto_rank_page_'),
    
    async execute(interaction) {
        await interaction.deferUpdate(); // Usa deferUpdate para atualizar a mensagem existente

        // Extrai o número da página do ID (ex: ponto_rank_page_2 -> 2)
        const requestedPage = parseInt(interaction.customId.split('_')[3]);
        const guildId = interaction.guild.id;
        const itemsPerPage = 10;
        
        // Segurança
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
            db.query(`SELECT COUNT(*) FROM ponto_leaderboard WHERE guild_id = $1`, [guildId])
        ]);

        const totalItems = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Se a página pedida não existe mais (ex: deletaram usuários), volta pra 1
        if (requestedPage > totalPages && totalPages > 0) return; // Ou tratar melhor

        // 2. Prepara Dados
        const rankingData = [];
        let position = offset + 1;

        for (const row of rankingRes.rows) {
            let discordUser = null;
            try {
                discordUser = await interaction.client.users.fetch(row.user_id).catch(() => null);
            } catch (e) {}

            rankingData.push({
                user: discordUser,
                total_ms: row.total_ms,
                position: position++
            });
        }

        // 3. Gera Nova Imagem
        const buffer = await generateRankingCard(interaction.guild, rankingData, requestedPage, totalPages);
        const attachment = new AttachmentBuilder(buffer, { name: 'ranking.png' });

        // 4. Atualiza Botões
        const row = new ActionRowBuilder();
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`ponto_rank_page_${requestedPage - 1}`)
                .setLabel('◀ Anterior')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(requestedPage <= 1),
            new ButtonBuilder()
                .setCustomId('ponto_rank_ignore')
                .setLabel(`${requestedPage}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`ponto_rank_page_${requestedPage + 1}`)
                .setLabel('Próxima ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(requestedPage >= totalPages)
        );

        // Edita a mensagem original com a nova imagem e botões
        await interaction.editReply({ 
            files: [attachment], 
            components: [row] 
        });
    }
};