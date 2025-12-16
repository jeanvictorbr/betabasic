const { AttachmentBuilder } = require('discord.js');
const db = require('../../database.js');
const { generateRanking } = require('../../utils/rankingGenerator.js');

function formatTime(ms) {
    if (!ms) return "0h 0m";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
}

module.exports = {
    customId: 'ponto_show_ranking',

    async execute(interaction) {
        // --- CORREÇÃO DO ERRO ---
        // Verifica se já foi respondido. Se não, usa deferReply.
        // Se já foi (deferred), apenas continua.
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        try {
            // 1. Busca TOP 10
            const res = await db.query(`
                SELECT user_id, total_ms 
                FROM ponto_leaderboard 
                WHERE guild_id = $1 
                ORDER BY total_ms DESC 
                LIMIT 10
            `, [interaction.guild.id]);

            if (res.rows.length === 0) {
                return interaction.editReply("O ranking está vazio! Ninguém bateu ponto ainda.");
            }

            // 2. Processa Nomes da Guilda
            const rankingData = [];

            for (const row of res.rows) {
                let displayName = 'Desconhecido';
                let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';

                try {
                    // Busca membro para pegar apelido no servidor
                    const member = await interaction.guild.members.fetch(row.user_id).catch(() => null);

                    if (member) {
                        displayName = member.displayName; // Nome na Guilda (Apelido)
                        avatarUrl = member.displayAvatarURL({ extension: 'png', size: 128 });
                    } else {
                        // Fallback user global
                        const user = await interaction.client.users.fetch(row.user_id).catch(() => null);
                        if (user) {
                            displayName = user.username;
                            avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
                        }
                    }
                } catch (e) {
                    console.error(`Erro ao buscar user ranking: ${row.user_id}`);
                }

                rankingData.push({
                    displayName: displayName,
                    avatarUrl: avatarUrl,
                    pointsStr: formatTime(row.total_ms)
                });
            }

            // 3. Gera Imagem (Premium + Neve)
            const buffer = await generateRanking(rankingData, interaction.guild.name);
            const attachment = new AttachmentBuilder(buffer, { name: 'ranking.png' });

            // 4. Envia
            await interaction.editReply({ 
                content: `🏆 **Ranking de Atividade**`,
                files: [attachment] 
            });

        } catch (error) {
            console.error(error);
            // Tenta avisar do erro se possível
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply("❌ Erro ao gerar o ranking.");
            }
        }
    }
};