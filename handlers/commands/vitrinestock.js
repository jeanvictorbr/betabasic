const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = async (interaction, guildSettings) => {
    // Busca o estoque
    const res = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC', [interaction.guildId]);
    
    if (res.rows.length === 0) return interaction.reply({ content: '❌ Nenhum produto em estoque. Use /addstock primeiro.', ephemeral: true });

    // Pega os textos e imagem configurados via /ferrari-config
    const title = guildSettings?.ferrari_vitrine_title || '🚘 Loja Premium | Estoque Imediato';
    const desc = guildSettings?.ferrari_vitrine_desc || 'Confira nossos veículos a pronta entrega! Escolha no menu abaixo o modelo desejado.';
    const image = guildSettings?.ferrari_vitrine_image || null;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor('#2b2d31');

    if (image && image.startsWith('http')) {
        embed.setImage(image);
    }

    let msgFields = '';
    // Pegar as 25 primeiras para a vitrine caber no SelectMenu sem dar o erro de limite do Discord
    const chunk = res.rows.slice(0, 25);

    chunk.forEach((prod, index) => {
        msgFields += `**${index + 1}. ${prod.name}**\n└ 📦 Unidades: \`${prod.quantity}\` | 💰 Preço: **${formatKK(Number(prod.price_kk))}**\n\n`;
    });

    embed.addFields({ name: 'Veículos Disponíveis', value: msgFields });

    // Menu de Seleção em vez de Botões!
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('svit_select')
        .setPlaceholder('🛒 Selecione o veículo que deseja comprar...')
        .addOptions(chunk.map(prod => ({
            label: prod.name,
            description: `Valor: ${formatKK(Number(prod.price_kk))} | Estoque: ${prod.quantity}`,
            value: prod.id.toString(),
            emoji: '🚘'
        })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Vitrine de Estoque enviada com sucesso.', ephemeral: true });
    
    setTimeout(() => interaction.deleteReply().catch(()=>{}), 5000);
};