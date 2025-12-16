const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const { generateRanking } = require('../../utils/rankingGenerator.js');

function formatTime(ms) {
    if (!ms) return "0h 0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
}

module.exports = {
    // Captura qualquer ID que comece com 'ponto_ranking_page_'
    customId: 'ponto_ranking_page_', 

    async execute(interaction) {
        // Para a rotação do botão imediatamente, pois a geração demora
        await interaction.deferUpdate();

        try {
            // 1. Descobre qual página o usuário quer ver
            // Ex: "ponto_ranking_page_2" -> page = 2
            const requestedPage = parseInt(interaction.customId.split('_').pop());
            const offset = (requestedPage - 1) * 10;

            // 2. Busca Total de Páginas novamente (caso tenha mudado)
            const countRes = await db.query('SELECT COUNT(*) FROM ponto_leaderboard WHERE guild_id = $1', [interaction.guild.id]);
            const totalRecords = parseInt(countRes.rows[0].count);
            const totalPages = Math.ceil(totalRecords / 10) || 1;

            // Validação simples
            if (requestedPage < 1 || requestedPage > totalPages) {
                return interaction.followUp({ content: "Página inexistente.", ephemeral: true });
            }

            // 3. Busca os dados com OFFSET
            const res = await db.query(`
                SELECT user_id, total_ms 
                FROM ponto_leaderboard 
                WHERE guild_id = $1 
                ORDER BY total_ms DESC 
                LIMIT 10 OFFSET $2
            `, [interaction.guild.id, offset]);

            // 4. Processa Nomes
            const rankingData = [];
            for (const row of res.rows) {
                let displayName = 'Desconhecido';
                let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
                try {
                    const member = await interaction.guild.members.fetch(row.user_id).catch(() => null);
                    if (member) {
                        displayName = member.displayName;
                        avatarUrl = member.displayAvatarURL({ extension: 'png', size: 128 });
                    } else {
                        const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
                        if (user) {
                            displayName = user.username;
                            avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
                        }
                    }
                } catch (e) {}
                rankingData.push({ displayName, avatarUrl, pointsStr: formatTime(row.total_ms) });
            }

            // 5. Gera Imagem
            const buffer = await generateRanking(rankingData, interaction.guild.name, requestedPage, totalPages);
            const attachment = new AttachmentBuilder(buffer, { name: `ranking_${requestedPage}.png` });

            // 6. Atualiza Botões
            const row = new ActionRowBuilder();
            
            // Botão Anterior
            row.addComponents(new ButtonBuilder()
                .setCustomId(`ponto_ranking_page_${requestedPage - 1}`)
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(requestedPage === 1)); // Desativa se for pág 1

            // Botão Próximo
            row.addComponents(new ButtonBuilder()
                .setCustomId(`ponto_ranking_page_${requestedPage + 1}`)
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(requestedPage === totalPages)); // Desativa se for a última

            // 7. Edita a mensagem original
            await interaction.editReply({ 
                content: `🏆 **Ranking de Atividade** (Página ${requestedPage}/${totalPages})`,
                files: [attachment],
                components: [row]
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: "❌ Erro ao mudar de página.", ephemeral: true });
        }
    }
};