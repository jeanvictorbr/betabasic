const db = require('../../database.js');

module.exports = {
    customId: 'ponto_show_ranking',
    async execute(interaction) {
        const guildId = interaction.guild.id;

        // Busca o TOP 10 ordenado por total_ms
        const result = await db.query(`
            SELECT user_id, total_ms 
            FROM ponto_leaderboard 
            WHERE guild_id = $1 
            ORDER BY total_ms DESC 
            LIMIT 10
        `, [guildId]);

        if (result.rows.length === 0) {
            return interaction.reply({ 
                content: "❌ O Ranking ainda está vazio. Comecem a bater ponto!", 
                flags: 1 << 6 
            });
        }

        // Função auxiliar para formatar MS em Texto Bonito
        const formatMs = (ms) => {
            const seconds = Math.floor((ms / 1000) % 60);
            const minutes = Math.floor((ms / (1000 * 60)) % 60);
            const hours = Math.floor((ms / (1000 * 60 * 60)));
            return `${hours}h ${minutes}m`;
        };

        let rankString = "";
        let position = 1;

        // Medalhas para os top 3
        const medals = ["🥇", "🥈", "🥉"];

        for (const row of result.rows) {
            const medal = medals[position - 1] || `**${position}º**`;
            const timeFormatted = formatMs(parseInt(row.total_ms));
            
            // Tenta pegar o nome do usuário cacheado ou menção
            rankString += `${medal} <@${row.user_id}> — \`${timeFormatted}\`\n`;
            position++;
        }

        const embed = {
            title: "🏆 Ranking de Atividade (Ponto)",
            description: rankString,
            color: 0xFFD700, // Dourado
            footer: {
                text: "BasicFlow Ranking • Atualizado em tempo real",
                icon_url: interaction.guild.iconURL()
            },
            timestamp: new Date().toISOString()
        };

        await interaction.reply({
            embeds: [embed],
            flags: 1 << 6 // Ephemeral (só quem clicou vê)
        });
    }
};