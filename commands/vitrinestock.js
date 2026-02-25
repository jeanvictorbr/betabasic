const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = async (interaction, guildSettings) => {
    const res = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC', [interaction.guildId]);
    if (res.rows.length === 0) return interaction.reply({ content: '❌ Nenhum produto em estoque.', ephemeral: true });

    // Configurações personalizadas (Fallback para os defaults)
    const title = guildSettings?.ferrari_vitrine_title || '🚘 Loja Premium | Estoque Imediato';
    const desc = guildSettings?.ferrari_vitrine_desc || 'Confira nossos veículos a pronta entrega!';
    const img = guildSettings?.ferrari_vitrine_image || null;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor('#2b2d31');
    if (img && img.startsWith('http')) embed.setImage(img);

    // Pegamos apenas a Página 1 (0 a 25)
    const page = 0;
    const chunk = res.rows.slice(page * 25, (page + 1) * 25);
    
    let msgFields = '';
    chunk.forEach((prod, index) => {
        msgFields += `**${(page * 25) + index + 1}. ${prod.name}**\n└ 📦 Estoque: \`${prod.quantity}\` | 💰 Preço: **${formatKK(Number(prod.price_kk))}**\n\n`;
    });
    embed.addFields({ name: 'Disponíveis nesta página', value: msgFields });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`svit_select`)
        .setPlaceholder('Escolha o veículo que deseja comprar...')
        .addOptions(chunk.map(prod => ({
            label: prod.name,
            description: `Valor: ${formatKK(Number(prod.price_kk))} | Estoque: ${prod.quantity}`,
            value: prod.id.toString(),
            emoji: '🛒'
        })));

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
    const components = [rowSelect];

    // Se tiver mais de 25, adiciona botão de paginação
    if (res.rows.length > 25) {
        const rowBtns = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`svit_page_${page - 1}`).setLabel('◀ Anterior').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId(`svit_page_${page + 1}`).setLabel('Próxima ▶').setStyle(ButtonStyle.Primary)
        );
        components.push(rowBtns);
    }

    await interaction.channel.send({ embeds: [embed], components: components });
    await interaction.reply({ content: '✅ Vitrine de Stock enviada.', ephemeral: true });
};