// Substitua em: ui/store/manageStockSelectMenu.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = function generateManageStockSelectMenu(products, currentPage, totalPages, isSearch = false, searchQuery = null) {
    // 1. Validação de Segurança
    if (!products || !Array.isArray(products)) products = [];
    currentPage = parseInt(currentPage) || 0;
    totalPages = parseInt(totalPages) || 1;

    // 2. Opções do Menu (Produtos)
    const options = products.map(p => {
        let priceFormatted = "R$ 0,00";
        try {
            priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } catch (e) { priceFormatted = `R$ ${p.price}`; }
        
        return {
            label: p.name ? p.name.substring(0, 100) : 'Produto Sem Nome',
            description: `ID: ${p.id} | 💰 ${priceFormatted}`,
            value: p.id.toString(),
            emoji: '📦'
        };
    });

    let placeholderText = `📖 Página ${currentPage + 1} de ${totalPages} - Selecione...`;
    if (options.length === 0) {
        options.push({ label: 'Nenhum produto aqui', value: 'no_result', emoji: '🚫' });
        placeholderText = "🚫 Lista vazia nesta página";
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_store_manage_stock')
        .setPlaceholder(isSearch ? `🔎 Busca: "${searchQuery}"` : placeholderText)
        .addOptions(options)
        .setDisabled(options[0].value === 'no_result');

    // 3. Botões de Paginação (Lógica Robusta)
    const paginationButtons = [];

    if (!isSearch && totalPages > 1) {
        // Botão ANTERIOR (Prefixo 'nav_')
        const prevPage = Math.max(0, currentPage - 1);
        paginationButtons.push(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_nav_${prevPage}`) // ID ÚNICO PARA SETA
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0)
        );

        // Botões NUMÉRICOS (Prefixo 'go_')
        // Mostra janela de 3 botões (ex: 4, 5, 6)
        let start = Math.max(0, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        
        // Ajustes de borda
        if (currentPage === 0) end = Math.min(totalPages - 1, 2);
        if (currentPage === totalPages - 1) start = Math.max(0, totalPages - 3);

        for (let i = start; i <= end; i++) {
            paginationButtons.push(
                new ButtonBuilder()
                    .setCustomId(`store_manage_stock_go_${i}`) // ID ÚNICO PARA NÚMERO
                    .setLabel(`${i + 1}`)
                    .setStyle(i === currentPage ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(i === currentPage)
            );
        }

        // Botão PRÓXIMO (Prefixo 'nav_')
        const nextPage = Math.min(totalPages - 1, currentPage + 1);
        paginationButtons.push(
            new ButtonBuilder()
                .setCustomId(`store_manage_stock_nav_${nextPage}`) // ID ÚNICO PARA SETA
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === totalPages - 1)
        );
    }

    // 4. Botões de Controle
    const controlButtons = [
        new ButtonBuilder().setCustomId('store_manage_stock_search').setLabel('Pesquisar').setEmoji('🔍').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('store_manage_products').setLabel('Voltar').setStyle(ButtonStyle.Danger)
    ];

    // 5. Montar Rows
    const rows = [new ActionRowBuilder().addComponents(selectMenu)];
    if (paginationButtons.length > 0) rows.push(new ActionRowBuilder().addComponents(paginationButtons));
    rows.push(new ActionRowBuilder().addComponents(controlButtons));

    // 6. Retorno V2
    const time = new Date().toLocaleTimeString('pt-BR');
    return [
        {
            type: 17,
            components: [{ type: 10, content: `> **📦 Gestão de Estoque Real**\n> **Página Atual:** ${currentPage + 1}/${totalPages} (${products.length} itens)\n> 🕒 *Atualizado às ${time}*` }]
        },
        ...rows
    ];
};