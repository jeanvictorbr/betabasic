const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = async (interaction, guildSettings) => {
    const res = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC LIMIT 25', [interaction.guildId]);
    
    if (res.rows.length === 0) return interaction.reply({ content: '❌ Nenhum produto em estoque. Use /addstock primeiro.', ephemeral: true });

    const title = guildSettings?.ferrari_vitrine_title || '🚘 Loja Premium | Estoque Imediato';
    const desc = guildSettings?.ferrari_vitrine_desc || 'Confira nossos veículos a pronta entrega!';
    const image = guildSettings?.ferrari_vitrine_image || null;

    const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor('#2b2d31');
    if (image && image.startsWith('http')) embed.setImage(image);

    let msgFields = '';
    res.rows.forEach((prod, index) => {
        msgFields += `**${index + 1}. ${prod.name}**\n└ 📦 Unidades: \`${prod.quantity}\` | 💰 Preço: **${formatKK(Number(prod.price_kk))}**\n\n`;
    });
    embed.addFields({ name: 'Veículos Disponíveis', value: msgFields });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('svit_select')
        .setPlaceholder('🛒 Selecione o veículo que deseja comprar...')
        .addOptions(res.rows.map(prod => ({
            label: prod.name,
            description: `Valor: ${formatKK(Number(prod.price_kk))} | Estoque: ${prod.quantity}`,
            value: prod.id.toString(),
            emoji: '🚘'
        })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Envia e salva a ID no banco!
    const sentMsg = await interaction.channel.send({ embeds: [embed], components: [row] });
    await db.query(`UPDATE guild_settings SET ferrari_vitrine_channel = $1, ferrari_vitrine_msg = $2 WHERE guild_id = $3`, [interaction.channelId, sentMsg.id, interaction.guildId]);

    await interaction.reply({ content: '✅ Vitrine de Estoque enviada com sucesso.', ephemeral: true });
    setTimeout(() => interaction.deleteReply().catch(()=>{}), 5000);
};