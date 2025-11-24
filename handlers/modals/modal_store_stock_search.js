const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_store_stock_search',
    async execute(interaction) {
        // DeferReply garante que o Discord espere a resposta
        await interaction.deferReply({ flags: EPHEMERAL_FLAG });
        
        const query = interaction.fields.getTextInputValue('search_query');

        // Busca produtos (Limite de 25 para caber no menu)
        const products = (await db.query(
            'SELECT id, name, price FROM store_products WHERE guild_id = $1 AND name ILIKE $2 ORDER BY id ASC LIMIT 25', 
            [interaction.guild.id, `%${query}%`]
        )).rows;

        if (products.length === 0) {
            return interaction.editReply({
                content: `❌ Nenhum produto encontrado com: **${query}**`,
                embeds: [], // Limpa embeds
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('store_manage_stock').setLabel('Voltar').setStyle(ButtonStyle.Primary)
                    )
                ]
            });
        }

        // Monta Opções
        const options = products.map(p => {
            const priceVal = parseFloat(p.price);
            const priceFormatted = isNaN(priceVal) ? "0,00" : priceVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return {
                label: p.name.substring(0, 100),
                description: `💰 ${priceFormatted} | ID: ${p.id}`,
                value: p.id.toString(),
                emoji: { name: "🔎" }
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_store_manage_stock')
            .setPlaceholder(`Resultados para: ${query}`)
            .addOptions(options);

        // Monta Embed Seguro
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🔍 Resultados da Pesquisa')
            .setDescription(`Encontrei **${products.length}** produto(s) contendo "**${query}**".\nSelecione abaixo para gerenciar.`);

        // Envia resposta com Embed + Menu (100% compatível)
        await interaction.editReply({
            content: null,
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