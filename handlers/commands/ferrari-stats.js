const db = require('../../database.js');
const { EmbedBuilder } = require('discord.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = async (interaction, guildSettings) => {
    // Validação de cargo Staff para visualizar
    if (guildSettings?.ferrari_staff_role && !interaction.member.roles.cache.has(guildSettings.ferrari_staff_role)) {
        return interaction.reply({ content: '❌ Você não tem permissão para ver estatísticas globais.', ephemeral: true });
    }

    await interaction.deferReply();

    // Dados Globais
    const globalRes = await db.query(`
        SELECT COUNT(id) as total_vendas, COALESCE(SUM(price_bruto), 0) as total_bruto, COALESCE(SUM(profit), 0) as total_lucro, COALESCE(SUM(price_caixa), 0) as total_caixa
        FROM ferrari_sales_log WHERE guild_id = $1
    `, [interaction.guildId]);
    const global = globalRes.rows[0];

    // TOP Vendedores (Agrupa por user_id)
    const topRes = await db.query(`
        SELECT user_id, COUNT(id) as vendas, SUM(profit) as lucro 
        FROM ferrari_sales_log WHERE guild_id = $1 
        GROUP BY user_id ORDER BY lucro DESC LIMIT 5
    `, [interaction.guildId]);

    const embed = new EmbedBuilder()
        .setTitle('📈 Estatísticas Globais - Módulo Ferrari')
        .setColor('#FFD700') // Dourado
        .addFields(
            { name: 'Vendas Totais', value: `\`${global.total_vendas}\``, inline: true },
            { name: 'Giro Financeiro (Bruto)', value: formatKK(Number(global.total_bruto)), inline: true },
            { name: '\u200B', value: '\u200B', inline: true }, // Spacer
            { name: 'Repasse Total (Caixa)', value: formatKK(Number(global.total_caixa)), inline: true },
            { name: 'Lucro Total Corretores', value: formatKK(Number(global.total_lucro)), inline: true }
        );

    let topString = '';
    topRes.rows.forEach((row, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        topString += `${medal} <@${row.user_id}> - Vendas: \`${row.vendas}\` | Lucro: **${formatKK(Number(row.lucro))}**\n`;
    });

    embed.addFields({ name: '🏆 TOP 5 Corretores', value: topString || 'Nenhuma venda registrada ainda.' });

    await interaction.editReply({ embeds: [embed] });
};