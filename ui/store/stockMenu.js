const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// DEFINIÇÃO RIGOROSA DAS FLAGS
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = (products, page = 0, isSearchResult = false) => {
    // 1. Lógica de Paginação
    const itemsPerPage = 25;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    
    if (page < 0) page = 0;
    if (page >= totalPages && totalPages > 0) page = totalPages - 1;

    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    const currentProducts = products.slice(start, end);

    // 2. Construção dos Componentes (JSON Puro type: 17 compliance)
    const components = [];

    // Row do Menu
    const menuRow = {
        type: 1,
        components: []
    };

    if (currentProducts.length > 0) {
        const menu = {
            type: 3, // String Select Menu
            custom_id: 'select_store_manage_stock',
            placeholder: 'Selecione um produto para gerir o estoque...',
            options: currentProducts.map(prod => ({
                label: prod.name.substring(0, 100),
                description: `Estoque atual: ${prod.stock_qty || 0} | ID: ${prod.id}`,
                value: prod.id.toString(),
                emoji: { name: '📦' }
            }))
        };
        menuRow.components.push(menu);
    } else {
        const menuDisabled = {
            type: 3,
            custom_id: 'disabled_menu',
            placeholder: 'Nenhum produto encontrado.',
            options: [{ label: 'Vazio', value: 'empty' }],
            disabled: true
        };
        menuRow.components.push(menuDisabled);
    }
    components.push(menuRow);

    // Row dos Botões
    const buttonRow = {
        type: 1,
        components: [
            {
                type: 2,
                style: 2, // Secondary
                label: 'Anterior',
                emoji: { name: '⬅️' },
                custom_id: `store_manage_stock_page_${page - 1}`,
                disabled: page === 0
            },
            {
                type: 2,
                style: 1, // Primary
                label: isSearchResult ? 'Limpar Pesquisa' : 'Pesquisar',
                emoji: { name: isSearchResult ? '✖️' : '🔍' },
                custom_id: isSearchResult ? 'store_manage_stock' : 'store_manage_stock_search'
            },
            {
                type: 2,
                style: 2, // Secondary
                label: 'Próxima',
                emoji: { name: '➡️' },
                custom_id: `store_manage_stock_page_${page + 1}`,
                disabled: page >= totalPages - 1
            }
        ]
    };
    components.push(buttonRow);

    // 3. Montagem da Resposta V2
    // CORREÇÃO CRÍTICA: As flags devem incluir V2_FLAG (1<<15)
    return {
        content: isSearchResult 
            ? `🔍 **Resultado da Pesquisa**\nEncontrados: ${products.length} produtos.\nPágina ${page + 1}/${totalPages || 1}`
            : `📦 **Gerenciamento de Estoque Real**\nTotal de Produtos: ${products.length}\nPágina ${page + 1}/${totalPages || 1}`,
        components: components,
        flags: V2_FLAG | EPHEMERAL_FLAG // OBRIGATÓRIO PARA APP V2
    };
};