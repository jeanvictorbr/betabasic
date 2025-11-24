// Substitua em: ui/store/manageStockSelectMenu.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = function generateManageStockSelectMenu(products, currentPage, totalPages, isSearch = false, searchQuery = null) {
    // Garante que products é um array
    if (!products || !Array.isArray(products)) products = [];

    // 1. Formatar Opções do Menu
    const options = products.map(p => {
        let priceFormatted = "R$ 0,00";
        try {
            // Tenta formatar, se falhar usa o valor bruto
            priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } catch (e) {
            priceFormatted = `R$ ${p.price}`;
        }
        
        return {
            label: p.name ? p.name.substring(0, 100) : 'Produto Sem Nome',
            description: `ID: ${p.id} | 💰 ${priceFormatted} | Gerir Estoque`,
            value: p.id.toString(),
            emoji: '📦'
        };
    });

    // Placeholder Dinâmico (Ajuda a ver que a página mudou)
    let placeholderText = `📖 Página ${currentPage + 1} de ${totalPages} - Selecione um produto...`;
    
    // Se não houver produtos na página (erro ou lista vazia)
    if (options.length === 0) {
        options.push({
            label: 'Nenhum produto nesta página',
            description: 'Volte para a página anterior.',
            value: 'no_result',
            emoji: '🚫'
        });
        placeholderText = "🚫 Lista vazia nesta página";
    }

    // 2. Criar o Menu
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_store_manage_stock')
        .setPlaceholder(isSearch ? `🔎 Resultados para: "${searchQuery}"` : placeholderText)
        .addOptions(options)
        .setDisabled(options[0].value === 'no_result');

    // 3. Botões de Navegação (Lógica corrigida)
    // Desativa "Anterior" se for a primeira página
    const btnPrev = new ButtonBuilder()
        .setCustomId(`store_manage_stock_page_${currentPage - 1}`) 
        .setLabel('Anterior')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 0 || isSearch);

    const btnSearch = new ButtonBuilder()
        .setCustomId('store_manage_stock_search')
        .setLabel('Pesquisar')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Primary);

    // Desativa "Próximo" se for a última página
    const btnNext = new ButtonBuilder()
        .setCustomId(`store_manage_stock_page_${currentPage + 1}`)
        .setLabel('Próximo')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= (totalPages - 1) || isSearch);

    const btnCancel = new ButtonBuilder()
        .setCustomId('store_manage_products') // Volta para o menu principal de produtos
        .setLabel('Voltar / Sair')
        .setStyle(ButtonStyle.Danger);

    // 4. Montar Rows
    const components = [
        new ActionRowBuilder().addComponents(selectMenu),
        new ActionRowBuilder().addComponents(btnPrev, btnSearch, btnNext),
        new ActionRowBuilder().addComponents(btnCancel)
    ];

    // 5. Retorno V2
    return [
        {
            type: 17,
            components: [
                { 
                    type: 10, 
                    content: isSearch 
                        ? `> **🔍 Resultado da Busca:** Encontrados ${products.length} produtos para \`${searchQuery}\`.`
                        : `> **📦 Gestão de Estoque Real**\n> Utilize o menu abaixo para selecionar um produto e gerenciar suas chaves/itens entregues automaticamente.\n> \n> **Total de Páginas:** ${totalPages} (Exibindo ${products.length} itens)` 
                }
            ]
        },
        ...components
    ];
};