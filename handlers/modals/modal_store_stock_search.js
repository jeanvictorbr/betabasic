const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_store_stock_search',
    async execute(interaction) {
        await interaction.deferReply({ flags: V2_FLAG | EPHEMERAL_FLAG });
        
        const query = interaction.fields.getTextInputValue('search_query');

        // Busca produtos filtrados por nome (Case insensitive)
        const products = (await db.query(
            'SELECT id, name, price FROM store_products WHERE guild_id = $1 AND name ILIKE $2 ORDER BY id ASC LIMIT 25', 
            [interaction.guild.id, `%${query}%`]
        )).rows;

        if (products.length === 0) {
            return interaction.editReply({
                content: `❌ Nenhum produto encontrado com o termo: **${query}**`,
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('store_manage_stock').setLabel('Voltar para Lista').setStyle(ButtonStyle.Primary)
                    )
                ]
            });
        }

        // Cria o menu com os resultados
        const options = products.map(p => {
            const priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return {
                label: `${p.name.substring(0, 80)}`,
                description: `💰 ${priceFormatted} | ID: ${p.id}`,
                value: p.id.toString(),
                emoji: { name: "🔎" } // Emoji de lupa para indicar resultado
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_store_manage_stock')
            .setPlaceholder(`Resultados para: ${query}`)
            .addOptions(options);

        const backButton = new ButtonBuilder()
            .setCustomId('store_manage_stock')
            .setLabel('Voltar para Todos')
            .setStyle(ButtonStyle.Secondary);

        await interaction.editReply({
            components: [
                { type: 17, components: [{ type: 10, content: `> **🔍 Resultados da Pesquisa**\n> Encontrei **${products.length}** produto(s) contendo "**${query}**".` }] },
                new ActionRowBuilder().addComponents(selectMenu),
                new ActionRowBuilder().addComponents(backButton)
            ]
        });
    }
};