const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock_page_', // O Index busca por 'startsWith'
    async execute(interaction) {
        await interaction.deferUpdate();

        // 1. Extrai a página do ID do botão (ex: ..._page_2)
        const parts = interaction.customId.split('_');
        const pageIndex = parseInt(parts[parts.length - 1]);
        const page = isNaN(pageIndex) ? 0 : pageIndex;

        // 2. Busca os produtos novamente
        const products = (await db.query('SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

        const ITEMS_PER_PAGE = 25;
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        
        // Garante que a página está dentro dos limites
        const safePage = Math.max(0, Math.min(page, totalPages - 1));

        // 3. Fatia os produtos
        const displayedProducts = products.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

        // 4. Cria o Menu (Igual ao principal)
        const options = displayedProducts.map(p => {
            const priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return {
                label: `${p.name.substring(0, 80)}`,
                description: `💰 ${priceFormatted} | ID: ${p.id}`,
                value: p.id.toString(),
                emoji: { name: "📦" }
            };
        });

        // Proteção contra página vazia (caso delete produtos enquanto navega)
        if (options.length === 0) {
            return interaction.editReply({ content: "⚠️ Esta página não tem mais produtos." });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_store_manage_stock')
            .setPlaceholder(`📦 Selecione (Pág ${safePage + 1}/${totalPages})`)
            .addOptions(options);

        // 5. Botões de Navegação
        const navigationRow = new ActionRowBuilder();

        // Botão Pesquisar
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId('store_manage_stock_search')
                .setLabel('🔍 Pesquisar')
                .setStyle(ButtonStyle.Success)
        );

        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${safePage - 1}`)
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(safePage === 0)
        );

        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId('store_manage_products')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${safePage + 1}`)
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(safePage >= totalPages - 1)
        );

        // 6. Atualiza
        await interaction.editReply({
            components: [
                { type: 17, components: [{ type: 10, content: `> **Gerenciamento de Estoque**\n> Exibindo produtos **${safePage * ITEMS_PER_PAGE + 1}** a **${Math.min((safePage + 1) * ITEMS_PER_PAGE, products.length)}** de **${products.length}**.` }] },
                new ActionRowBuilder().addComponents(selectMenu), 
                navigationRow
            ],
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};