const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock_page_', // Prefixo para detecção dinâmica
    async execute(interaction) {
        await interaction.deferUpdate();

        // 1. Extrai o número da página do ID do botão
        // Ex: store_manage_stock_page_1 -> page = 1
        const parts = interaction.customId.split('_');
        let page = parseInt(parts[parts.length - 1]);
        if (isNaN(page)) page = 0;

        // 2. Busca TODOS os produtos novamente
        const products = (await db.query('SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;

        // 3. Cálculos de Paginação
        const ITEMS_PER_PAGE = 25;
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        
        // Garante que a página pedida existe (evita crash se produtos foram deletados)
        const safePage = Math.max(0, Math.min(page, totalPages - 1));

        // 4. Fatia os produtos para a página correta
        const start = safePage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const displayedProducts = products.slice(start, end);

        if (displayedProducts.length === 0) {
            return interaction.editReply({ content: "⚠️ Não há produtos nesta página." });
        }

        // 5. Cria o Menu (Mesmo padrão do principal)
        const options = displayedProducts.map(p => {
            const priceVal = parseFloat(p.price);
            const priceFormatted = isNaN(priceVal) ? "R$ 0,00" : priceVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

        // 6. Botões de Navegação
        const navigationRow = new ActionRowBuilder();

        // Pesquisa
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId('store_manage_stock_search')
                .setLabel('🔍 Pesquisar')
                .setStyle(ButtonStyle.Success)
        );

        // Anterior
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${safePage - 1}`)
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(safePage === 0)
        );

        // Cancelar
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId('store_manage_products')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        // Próxima
        navigationRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_page_${safePage + 1}`)
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(safePage >= totalPages - 1)
        );

        // 7. Atualiza a mensagem
        await interaction.editReply({
            components: [
                { type: 17, components: [{ type: 10, content: `> **Gerenciamento de Estoque**\n> Exibindo produtos **${start + 1}** a **${Math.min(end, products.length)}** de **${products.length}**.` }] },
                new ActionRowBuilder().addComponents(selectMenu), 
                navigationRow
            ],
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};