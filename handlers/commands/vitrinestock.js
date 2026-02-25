const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const { formatKK } = require('../../utils/rpCurrency.js');

module.exports = async (interaction, guildSettings) => {
    // Busca o estoque disponível
    const res = await db.query('SELECT * FROM ferrari_stock_products WHERE guild_id = $1 AND quantity > 0 ORDER BY id ASC', [interaction.guildId]);
    
    if (res.rows.length === 0) return interaction.reply({ content: '❌ Nenhum produto em estoque. Use /addstock primeiro.', ephemeral: true });

    const embed = new EmbedBuilder()
        .setTitle('🚘 Loja Premium | Estoque Imediato')
        .setDescription('Confira nossos veículos a pronta entrega! Clique no botão correspondente abaixo para reservar/comprar o seu.')
        .setColor('#2b2d31')
        .setImage('https://i.imgur.com/YOUR_IMAGE_HERE.png');

    let msgFields = '';
    const components = [];
    let currentRow = new ActionRowBuilder();

    res.rows.forEach((prod, index) => {
        msgFields += `**${index + 1}. ${prod.name}**\n└ 📦 Unidades: \`${prod.quantity}\` | 💰 Preço: **${formatKK(Number(prod.price_kk))}**\n\n`;
        
        // Adiciona botões dinâmicos (Máx 5 por row)
        if (currentRow.components.length === 5) {
            components.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`sbuy_${prod.id}`)
                .setLabel(`Comprar #${index + 1}`)
                .setStyle(ButtonStyle.Success)
        );
    });

    if (currentRow.components.length > 0) components.push(currentRow);

    embed.addFields({ name: 'Veículos Disponíveis', value: msgFields });

    await interaction.channel.send({ embeds: [embed], components: components });
    await interaction.reply({ content: '✅ Vitrine de Stock enviada.', ephemeral: true });
};