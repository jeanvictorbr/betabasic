// Crie em: ui/store/categoryProductSelect.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = function generateCategoryProductSelect(products, currentPage, totalPages, mode, categoryId, isSearch = false, searchQuery = null) {
    // mode: 'add' ou 'remove'
    const isAdd = mode === 'add';
    
    if (!products || !Array.isArray(products)) products = [];
    currentPage = parseInt(currentPage) || 0;
    totalPages = parseInt(totalPages) || 1;

    // 1. Opções
    const options = products.map(p => {
        let priceFormatted = `R$ ${p.price}`; 
        try { priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); } catch (e) {}
        
        return {
            label: p.name.substring(0, 100),
            description: `ID: ${p.id} | ${priceFormatted} | ${isAdd ? 'Clique para ADICIONAR' : 'Clique para REMOVER'}`,
            value: p.id.toString(),
            emoji: isAdd ? '📥' : '📤'
        };
    });

    let placeholder = `📖 Pág. ${currentPage + 1}/${totalPages} - Selecione para ${isAdd ? 'ADICIONAR' : 'REMOVER'}...`;
    if (options.length === 0) {
        options.push({ label: 'Nenhum produto disponível', value: 'no_result', emoji: '🚫' });
        placeholder = "🚫 Lista Vazia";
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`select_store_cat_product_${mode}_${categoryId}`) // ID carrega modo e cat
        .setPlaceholder(isSearch ? `🔎 Busca: "${searchQuery}"` : placeholder)
        .addOptions(options)
        .setDisabled(options[0].value === 'no_result');

    // 2. Paginação Numérica
    const paginationButtons = [];
    if (!isSearch && totalPages > 1) {
        let start = Math.max(0, currentPage - 2);
        let end = Math.min(totalPages - 1, currentPage + 2);
        if (currentPage < 2) end = Math.min(totalPages - 1, 4);
        if (currentPage > totalPages - 3) start = Math.max(0, totalPages - 5);

        for (let i = start; i <= end; i++) {
            paginationButtons.push(
                new ButtonBuilder()
                    // ID carrega tudo: store_cat_pg_add_5_0 (Modo_Cat_Pag)
                    .setCustomId(`store_cat_pg_${mode}_${categoryId}_${i}`)
                    .setLabel(`${i + 1}`)
                    .setStyle(i === currentPage ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(i === currentPage)
            );
        }
    }

    // 3. Controles
    const controlButtons = [
        new ButtonBuilder().setCustomId(`store_cat_search_${mode}_${categoryId}`).setLabel('Pesquisar').setEmoji('🔍').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`store_manage_category_products_${categoryId}`).setLabel('Voltar').setStyle(ButtonStyle.Danger)
    ];

    const rows = [new ActionRowBuilder().addComponents(selectMenu)];
    if (paginationButtons.length > 0) rows.push(new ActionRowBuilder().addComponents(paginationButtons));
    rows.push(new ActionRowBuilder().addComponents(controlButtons));

    const time = new Date().toLocaleTimeString('pt-BR');
    const title = isAdd ? `> **➕ Adicionar à Categoria**` : `> **➖ Remover da Categoria**`;

    return [
        {
            type: 17,
            components: [{ type: 10, content: `${title} | Pág. ${currentPage + 1}/${totalPages}\n> *Atualizado às ${time}*` }]
        },
        ...rows
    ];
};