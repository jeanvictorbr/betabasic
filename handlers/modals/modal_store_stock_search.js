const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_store_stock_search',
    async execute(interaction) {
        await interaction.deferReply({ flags: EPHEMERAL_FLAG });
        
        const query = interaction.fields.getTextInputValue('search_query');

        const products = (await db.query(
            'SELECT id, name, price FROM store_products WHERE guild_id = $1 AND name ILIKE $2 ORDER BY id ASC LIMIT 25', 
            [interaction.guild.id, `%${query}%`]
        )).rows;

        if (products.length === 0) {
            return interaction.editReply({
                content: `❌ Nenhum produto encontrado com o termo: **${query}**`,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('store_manage_stock').setLabel('Voltar').setStyle(ButtonStyle.Primary)
                    )
                ]
            });
        }

        const options = products.map(p => {
            const priceVal = parseFloat(p.price);
            const priceFormatted = isNaN(priceVal) ? "R$ 0,00" : priceVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return {
                label: p.name.substring(0, 100),
                description: `💰 ${priceFormatted} | ID: ${p.id}`,
                value: p.id.toString(),
                emoji: { name: "🔎" }
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_store_manage_stock')
            .setPlaceholder(`🔍 Resultados: ${query}`)
            .addOptions(options);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🔍 Resultados da Pesquisa')
            .setDescription(`Encontrei **${products.length}** produto(s) com o termo "**${query}**".\nSelecione abaixo para gerenciar.`);

        await interaction.editReply({
            embeds: [embed],
            components: [
                new ActionRowBuilder().addComponents(selectMenu),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('store_manage_stock').setLabel('Voltar para Todos').setStyle(ButtonStyle.Secondary)
                )
            ]
        });
    }
};