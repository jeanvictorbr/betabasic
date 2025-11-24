const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'store_manage_stock_page_', 
    async execute(interaction) {
        try {
            await interaction.deferUpdate();

            const parts = interaction.customId.split('_');
            let page = parseInt(parts[parts.length - 1]);
            if (isNaN(page)) page = 0;

            const products = (await db.query('SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

            const ITEMS_PER_PAGE = 25;
            const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
            const safePage = Math.max(0, Math.min(page, totalPages - 1));

            const start = safePage * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const displayedProducts = products.slice(start, end);

            if (displayedProducts.length === 0) {
                return interaction.followUp({ content: "⚠️ Página vazia.", ephemeral: true });
            }

            const options = displayedProducts.map(p => {
                const priceVal = parseFloat(p.price);
                const priceFormatted = isNaN(priceVal) ? "0,00" : priceVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                return {
                    label: p.name.substring(0, 80),
                    description: `💰 ${priceFormatted} | ID: ${p.id}`,
                    value: p.id.toString(),
                    emoji: { name: "📦" }
                };
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_store_manage_stock')
                .setPlaceholder(`📦 Selecione (Pág ${safePage + 1}/${totalPages})`)
                .addOptions(options);

            const navigationRow = new ActionRowBuilder();
            navigationRow.addComponents(
                new ButtonBuilder().setCustomId('store_manage_stock_search').setLabel('Pesquisar').setStyle(ButtonStyle.Success).setEmoji('🔍'),
                new ButtonBuilder().setCustomId(`store_manage_stock_page_${safePage - 1}`).setLabel('Anterior').setStyle(ButtonStyle.Primary).setDisabled(safePage === 0),
                new ButtonBuilder().setCustomId('store_manage_products').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`store_manage_stock_page_${safePage + 1}`).setLabel('Próxima').setStyle(ButtonStyle.Primary).setDisabled(safePage >= totalPages - 1)
            );

            await interaction.editReply({
                embeds: [], // Garante limpar embeds
                components: [
                    { 
                        type: 17, 
                        components: [
                            { type: 10, content: `## 📦 Gerenciamento de Estoque` },
                            { type: 10, content: `Selecione um produto abaixo para adicionar ou remover estoque.\n> 📊 **Total de Produtos:** \`${products.length}\`\n> 📄 **Página:** \`${safePage + 1}/${totalPages}\`` }
                        ] 
                    },
                    new ActionRowBuilder().addComponents(selectMenu), 
                    navigationRow
                ]
            });

        } catch (error) {
            console.error('Erro na paginação de estoque:', error);
        }
    }
};