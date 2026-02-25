const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = {
    customId: 'ferrari_meu_status',
    async execute(interaction) {
        // Modo ephemeral para apenas o corretor ver seu painel
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        // Função turbinada: Separa Venda de Troca na contagem do Banco de Dados
        const getStats = async (timeCondition) => {
            const res = await db.query(`
                SELECT 
                    COUNT(id) as total_geral,
                    COALESCE(SUM(CASE WHEN sale_type = 'venda' THEN 1 ELSE 0 END), 0) as total_vendas,
                    COALESCE(SUM(CASE WHEN sale_type = 'troca' THEN 1 ELSE 0 END), 0) as total_trocas,
                    COALESCE(SUM(price_caixa), 0) as total_caixa,
                    COALESCE(SUM(profit), 0) as total_lucro
                FROM ferrari_sales_log 
                WHERE guild_id = $1 AND user_id = $2 ${timeCondition}
            `, [guildId, userId]);
            return res.rows[0];
        };

        // Resgatando os 3 períodos
        const statsHoje = await getStats("AND created_at >= current_date");
        const statsMes = await getStats("AND date_trunc('month', created_at) = date_trunc('month', current_date)");
        const statsTotal = await getStats("");

        // Montando a Embed super completa
        const embed = new EmbedBuilder()
            .setTitle(`📊 Painel do Corretor | ${interaction.user.username}`)
            .setDescription('Balanço consolidado de todas as suas operações na concessionária.')
            .setColor('#FF0000') // Vermelho Ferrari
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { 
                    name: '📅 HOJE', 
                    value: `💵 Vendas: \`${statsHoje.total_vendas}\` | 🔄 Trocas: \`${statsHoje.total_trocas}\`\n🏦 Repasse ao Caixa: **${formatKK(Number(statsHoje.total_caixa))}**\n🤑 Seu Lucro: **${formatKK(Number(statsHoje.total_lucro))}**`, 
                    inline: false 
                },
                { 
                    name: '📆 ESTE MÊS', 
                    value: `💵 Vendas: \`${statsMes.total_vendas}\` | 🔄 Trocas: \`${statsMes.total_trocas}\`\n🏦 Repasse ao Caixa: **${formatKK(Number(statsMes.total_caixa))}**\n🤑 Seu Lucro: **${formatKK(Number(statsMes.total_lucro))}**`, 
                    inline: false 
                },
                { 
                    name: '🏆 TOTAL HISTÓRICO', 
                    value: `📊 Operações Totais: \`${statsTotal.total_geral}\` (💵 \`${statsTotal.total_vendas}\` Vendas | 🔄 \`${statsTotal.total_trocas}\` Trocas)\n🤑 Lucro Total Arrecadado: **${formatKK(Number(statsTotal.total_lucro))}**`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'NC - Centro Comercial', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};