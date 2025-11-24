const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = (products, page = 0, isSearchResult = false) => {
    // 1. Lógica de Paginação
    const itemsPerPage = 25;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    
    // Garante que a página não exceda os limites
    if (page < 0) page = 0;
    if (page >= totalPages && totalPages > 0) page = totalPages - 1;

    const start = page * itemsPerPage;
    const end = start + itemsPerPage;
    const currentProducts = products.slice(start, end);

    // 2. Construção do Menu
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
        // Caso não haja produtos (pesquisa falhou ou loja vazia)
        const menuDisabled = {
            type: 3,
            custom_id: 'disabled_menu',
            placeholder: 'Nenhum produto encontrado.',
            options: [{ label: 'Vazio', value: 'empty' }],
            disabled: true
        };
        menuRow.components.push(menuDisabled);
    }

    // 3. Construção dos Botões de Navegação e Pesquisa
    const buttonRow = {
        type: 1,
        components: [
            {
                type: 2,
                style: 2, // Secondary (Cinza)
                label: 'Anterior',
                emoji: { name: '⬅️' },
                custom_id: `store_manage_stock_page_${page - 1}`,
                disabled: page === 0 // Desativa se for a primeira página
            },
            {
                type: 2,
                style: 1, // Primary (Azul)
                label: isSearchResult ? 'Limpar Pesquisa' : 'Pesquisar',
                emoji: { name: isSearchResult ? '✖️' : '🔍' },
                custom_id: isSearchResult ? 'store_manage_stock' : 'store_manage_stock_search' 
                // Se já é pesquisa, volta pro menu principal. Se não, abre busca.
            },
            {
                type: 2,
                style: 2, // Secondary (Cinza)
                label: 'Próxima',
                emoji: { name: '➡️' },
                custom_id: `store_manage_stock_page_${page + 1}`,
                disabled: page >= totalPages - 1 // Desativa se for a última página
            }
        ]
    };

    // Montagem da resposta V2
    const response = {
        content: isSearchResult 
            ? `🔍 **Resultado da Pesquisa**\nEncontrados: ${products.length} produtos.\nPágina ${page + 1}/${totalPages || 1}`
            : `📦 **Gerenciamento de Estoque Real**\nTotal de Produtos: ${products.length}\nPágina ${page + 1}/${totalPages || 1}`,
        components: [menuRow, buttonRow],
        flags: EPHEMERAL_FLAG // Apenas visível para quem clicou
    };

    // Importante: type: 17 é para APIs, aqui retornamos o corpo da resposta
    // O handler deve envolver isso no update ou reply
    return response;
};