const db = require('../../database.js');
const { generateRankingCard } = require('../../utils/rankingGenerator.js');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'ponto_show_ranking',
    async execute(interaction) {
        // --- CORREÇÃO DO ERRO CRÍTICO ---
        // Se a interação já foi respondida ou diferida (por duplo clique ou lag), para aqui.
        if (interaction.replied || interaction.deferred) {
            console.warn(`[Ranking] Interação ${interaction.id} ignorada pois já foi processada.`);
            return;
        }

        try {
            // Tenta deferir. Se falhar aqui, é um erro de rede ou da API do Discord.
            await interaction.deferReply({ flags: 1 << 6 }); // Ephemeral
        } catch (error) {
            console.error("[Ranking] Erro ao deferir resposta:", error.message);
            return; // Não adianta continuar se não podemos responder
        }

        const guildId = interaction.guild.id;
        const page = 1;
        const itemsPerPage = 10;
        const offset = (page - 1) * itemsPerPage;

        // 1. Busca Dados e Total (Contagem otimizada)
        const [rankingRes, countRes] = await Promise.all([
            db.query(`
                SELECT user_id, total_ms 
                FROM ponto_leaderboard 
                WHERE guild_id = $1 
                ORDER BY total_ms DESC 
                LIMIT $2 OFFSET $3
            `, [guildId, itemsPerPage, offset]),
            // Conta apenas se tiver dados, evita query desnecessária se rankingRes for vazio
            db.query(`SELECT COUNT(user_id) FROM ponto_leaderboard WHERE guild_id = $1`, [guildId])
        ]);

        if (rankingRes.rows.length === 0) {
            return interaction.editReply("❌ O Ranking está vazio ainda. Comecem a trabalhar! 💪");
        }

        const totalItems = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // 2. Prepara Dados para o Canvas (Fetch Users)
        const rankingData = [];
        let position = offset + 1;

        // Fetch em paralelo para ser mais rápido
        const userPromises = rankingRes.rows.map(row => interaction.client.users.fetch(row.user_id).catch(() => null));
        const users = await Promise.all(userPromises);

        for (let i = 0; i < rankingRes.rows.length; i++) {
            rankingData.push({
                user: users[i],
                total_ms: rankingRes.rows[i].total_ms,
                position: position++
            });
        }

        // 3. Gera Imagem (Visual Premium V2)
        const buffer = await generateRankingCard(interaction.guild, rankingData, page, totalPages);
        const attachment = new AttachmentBuilder(buffer, { name: 'ranking-premium.png' });

        // 4. Botões de Navegação
        const row = new ActionRowBuilder();
        
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`ponto_rank_page_${page - 1}`)
                .setLabel('◀')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('ponto_rank_ignore')
                .setLabel(`Página ${page} de ${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`ponto_rank_page_${page + 1}`)
                .setLabel('▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(totalPages <= 1)
        );

        await interaction.editReply({ 
            files: [attachment], 
            components: [row] 
        });
    }
};