const { AttachmentBuilder } = require('discord.js');
const db = require('../../database.js');
// Importa o gerador novo (Certifique-se que o nome do arquivo bate com o import)
const { generateRanking } = require('../../utils/rankingGenerator.js');

// Função auxiliar simples para formatar tempo
function formatTime(ms) {
    if (!ms) return "0h 0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
}

module.exports = {
    customId: 'ponto_show_ranking', // ID do botão

    async execute(interaction) {
        // Deferir a resposta para não dar erro de tempo limite, pois gerar imagem demora
        await interaction.deferReply({ ephemeral: true });

        try {
            // 1. Busca os TOP 10 do Banco de Dados
            const res = await db.query(`
                SELECT user_id, total_ms 
                FROM ponto_leaderboard 
                WHERE guild_id = $1 
                ORDER BY total_ms DESC 
                LIMIT 10
            `, [interaction.guild.id]);

            if (res.rows.length === 0) {
                return interaction.editReply("🎅 Ho Ho Ho! Ninguém bateu ponto ainda. A lista está vazia!");
            }

            // 2. Prepara os dados buscando o NOME DA GUILDA (Apelido)
            const rankingData = [];

            for (const row of res.rows) {
                let displayName = 'Desconhecido';
                let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';

                try {
                    // Tenta buscar o MEMBRO na Guilda (Cache ou API)
                    const member = await interaction.guild.members.fetch(row.user_id).catch(() => null);

                    if (member) {
                        // Se achou o membro, pega o Apelido (Display Name) e o Avatar da Guilda (se tiver)
                        displayName = member.displayName;
                        avatarUrl = member.displayAvatarURL({ extension: 'png', size: 128 });
                    } else {
                        // Se o membro saiu, tenta pegar o usuário global
                        const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
                        if (user) {
                            displayName = user.username; // Fallback para username
                            avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
                        }
                    }
                } catch (e) {
                    console.error(`Erro ao buscar user ranking: ${row.user_id}`);
                }

                rankingData.push({
                    displayName: displayName, // MANDANDO O APELIDO DA GUILD
                    avatarUrl: avatarUrl,
                    pointsStr: formatTime(row.total_ms)
                });
            }

            // 3. Gera a Imagem Natalina
            const buffer = await generateRanking(rankingData, interaction.guild.name);
            const attachment = new AttachmentBuilder(buffer, { name: 'ranking-natal.png' });

            // 4. Envia
            await interaction.editReply({ 
                content: `🎄 **Top 10 - Ranking de Atividade** 🎄`,
                files: [attachment] 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply("❌ Ocorreu um erro ao gerar o ranking de Natal.");
        }
    }
};