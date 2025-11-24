// Substitua em: ui/store/manageStockSelectMenu.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Gera o menu de seleção de produtos para gestão de estoque com paginação robusta.
 * @param {Array} products - Array de produtos da página atual.
 * @param {number} currentPage - Página atual (0-indexado).
 * @param {number} totalPages - Total de páginas calculado.
 * @param {boolean} isSearch - Se é modo de busca (desativa paginação).
 * @param {string|null} searchQuery - Termo buscado.
 */
module.exports = function generateManageStockSelectMenu(products, currentPage, totalPages, isSearch = false, searchQuery = null) {
    // Garante que products é um array
    if (!products || !Array.isArray(products)) products = [];

    // 1. Construir as opções do Menu
    const options = products.map(p => {
        // Formatação segura do preço
        let priceFormatted = "R$ 0,00";
        try {
            priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } catch (e) {
            priceFormatted = `R$ ${p.price}`;
        }
        
        return {
            label: p.name ? p.name.substring(0, 100) : 'Produto Sem Nome',
            description: `ID: ${p.id} | 💰 ${priceFormatted} | Clique para gerir`,
            value: p.id.toString(),
            emoji: '📦'
        };
    });

    // Tratamento para lista vazia
    let placeholderText = `Selecione um produto (Pág ${currentPage + 1}/${totalPages > 0 ? totalPages : 1})`;
    if (options.length === 0) {
        options.push({
            label: 'Nenhum produto encontrado',
            description: 'Não há itens para exibir nesta página.',
            value: 'no_result',
            emoji: '🚫'
        });
        placeholderText = "Nenhum produto disponível";
    }

    // 2. Criar o Select Menu
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_store_manage_stock')
        .setPlaceholder(isSearch ? `🔎 Busca: "${searchQuery}"` : placeholderText)
        .addOptions(options)
        .setDisabled(options[0].value === 'no_result');

    // 3. Lógica dos Botões de Navegação
    // Desativa se for a primeira página ou se for uma busca
    const prevDisabled = currentPage <= 0 || isSearch;
    // Desativa se for a última página, se não tiver páginas, ou se for uma busca
    const nextDisabled = currentPage >= (totalPages - 1) || totalPages === 0 || isSearch;

    const btnPrev = new ButtonBuilder()
        .setCustomId(`store_manage_stock_page_${currentPage - 1}`) // ID Dinâmico
        .setLabel('Anterior')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(prevDisabled);

    const btnSearch = new ButtonBuilder()
        .setCustomId('store_manage_stock_search')
        .setLabel('Pesquisar')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Primary);

    const btnNext = new ButtonBuilder()
        .setCustomId(`store_manage_stock_page_${currentPage + 1}`) // ID Dinâmico
        .setLabel('Próximo')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(nextDisabled);

    const btnCancel = new ButtonBuilder()
        .setCustomId('store_manage_products')
        .setLabel(isSearch ? 'Limpar Busca / Voltar' : 'Voltar ao Menu')
        .setStyle(ButtonStyle.Danger);

    // 4. Montagem das Rows
    const components = [
        new ActionRowBuilder().addComponents(selectMenu),
        new ActionRowBuilder().addComponents(btnPrev, btnSearch, btnNext),
        new ActionRowBuilder().addComponents(btnCancel)
    ];

    // 5. Retorno da Estrutura V2
    return [
        {
            type: 17,
            components: [
                { 
                    type: 10, 
                    content: isSearch 
                        ? `> **🔍 Resultado da Busca:** Exibindo produtos para \`${searchQuery}\`.`
                        : `> **📦 Gestão de Estoque:** Navegue pelas páginas para encontrar o produto.\n> **Página:** ${currentPage + 1} de ${totalPages > 0 ? totalPages : 1}` 
                }
            ]
        },
        ...components
    ];
};