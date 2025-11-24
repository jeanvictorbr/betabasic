// Crie em: ui/store/manageStockSelectMenu.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Gera o menu de seleção de produtos para gestão de estoque com paginação.
 * @param {Array} products - Array de produtos da página atual.
 * @param {number} currentPage - Página atual (0-indexado).
 * @param {number} totalPages - Total de páginas.
 * @param {boolean} isSearch - Se é um resultado de busca (para ajustar o texto).
 * @param {string|null} searchQuery - O termo buscado (se houver).
 */
module.exports = function generateManageStockSelectMenu(products, currentPage, totalPages, isSearch = false, searchQuery = null) {
    // 1. Construir as opções do Menu
    const options = products.map(p => {
        // Formata o preço para BRL
        const priceFormatted = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        return {
            label: p.name.substring(0, 100), // Limite do Discord
            description: `ID: ${p.id} | Preço: ${priceFormatted} | 📦 Gerir Estoque`,
            value: p.id.toString(),
            emoji: '📦' // Emoji bonito como solicitado
        };
    });

    // Se não houver produtos (ex: busca sem resultados ou loja vazia)
    if (options.length === 0) {
        options.push({
            label: 'Nenhum produto encontrado',
            description: 'Tente outra busca ou adicione produtos.',
            value: 'no_result',
            emoji: '🚫'
        });
    }

    // 2. Criar o Select Menu usando Builder (padrão para componentes internos de rows)
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_store_manage_stock')
        .setPlaceholder(isSearch ? `Resultados para: "${searchQuery}"` : `Selecione um produto (Página ${currentPage + 1}/${totalPages})`)
        .addOptions(options)
        .setDisabled(options[0].value === 'no_result');

    // 3. Criar Botões de Navegação
    const btnPrev = new ButtonBuilder()
        .setCustomId(`store_manage_stock_page_${currentPage - 1}`)
        .setLabel('Anterior')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0 || isSearch); // Desativa se for primeira página ou busca

    const btnSearch = new ButtonBuilder()
        .setCustomId('store_manage_stock_search')
        .setLabel('Pesquisar Produto')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Primary);

    const btnNext = new ButtonBuilder()
        .setCustomId(`store_manage_stock_page_${currentPage + 1}`)
        .setLabel('Próximo')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages - 1 || isSearch); // Desativa se for última página ou busca

    // Botão de cancelar/voltar
    const btnCancel = new ButtonBuilder()
        .setCustomId('store_manage_products')
        .setLabel(isSearch ? 'Limpar Busca' : 'Voltar')
        .setStyle(ButtonStyle.Danger);

    // 4. Montar Rows
    // Nota: Estamos retornando array de componentes compatível com a estrutura raw ou builders misturados, 
    // mas para manter compatibilidade total com interações complexas, usamos Builders dentro das Rows.
    
    const components = [
        new ActionRowBuilder().addComponents(selectMenu),
        new ActionRowBuilder().addComponents(btnPrev, btnSearch, btnNext),
        new ActionRowBuilder().addComponents(btnCancel)
    ];

    // 5. Retornar estrutura V2 (Type 17)
    return [
        {
            type: 17,
            components: [
                { 
                    type: 10, 
                    content: isSearch 
                        ? `> **🔍 Resultados da Busca:** Exibindo produtos contendo \`${searchQuery}\`.`
                        : `> **📦 Gestão de Estoque Real:** Selecione um produto abaixo para gerenciar chaves/itens.\n> **Página:** ${currentPage + 1} de ${totalPages > 0 ? totalPages : 1}` 
                }
            ]
        },
        ...components // Espalha as ActionRows geradas pelos builders
    ];
};