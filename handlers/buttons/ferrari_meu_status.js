const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = {
    customId: 'ferrari_meu_status',
    async execute(interaction) {
        // Ephemeral = Só o usuário vê
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        const getStats = async (timeCondition) => {
            const res = await db.query(`
                SELECT 
                    COUNT(id) as total_vendas,
                    COALESCE(SUM(price_bruto), 0) as total_bruto,
                    COALESCE(SUM(price_caixa), 0) as total_caixa,
                    COALESCE(SUM(profit), 0) as total_lucro
                FROM ferrari_sales_log 
                WHERE guild_id = $1 AND user_id = $2 ${timeCondition}
            `, [guildId, userId]);
            return res.rows[0];
        };

        const statsHoje = await getStats("AND created_at >= current_date");
        const statsMes = await getStats("AND date_trunc('month', created_at) = date_trunc('month', current_date)");
        const statsTotal = await getStats("");

        const embed = new EmbedBuilder()
            .setTitle(`📊 Relatório de Vendas | ${interaction.user.username}`)
            .setColor('#FF0000')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { 
                    name: '📅 HOJE', 
                    value: `Vendas: \`${statsHoje.total_vendas}\`\nCaixa a depositar: **${formatKK(Number(statsHoje.total_caixa))}**\nSeu Lucro: **${formatKK(Number(statsHoje.total_lucro))}**`, 
                    inline: false 
                },
                { 
                    name: '📆 ESTE MÊS', 
                    value: `Vendas: \`${statsMes.total_vendas}\`\nCaixa a depositar: **${formatKK(Number(statsMes.total_caixa))}**\nSeu Lucro: **${formatKK(Number(statsMes.total_lucro))}**`, 
                    inline: false 
                },
                { 
                    name: '🏆 TOTAL HISTÓRICO', 
                    value: `Vendas Totais: \`${statsTotal.total_vendas}\`\nLucro Total: **${formatKK(Number(statsTotal.total_lucro))}**`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'NC - Centro Comercial' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};