// Crie em: ui/store/stockList.js
const { ButtonStyle } = require('discord.js');

module.exports = async (products, page = 0, totalPages = 1, searchTerm = null) => {
    const fields = [];
    const actionButtons = [];

    // Itera sobre os produtos (máximo 3 por página)
    products.forEach((product, index) => {
        // Adiciona o divisor antes de cada produto (exceto o primeiro)
        if (index > 0) {
            fields.push({ name: ' ', value: '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯' });
        }

        // Adiciona os detalhes do produto
        fields.push({
            name: `📦 ${product.name}`,
            value: `💰 **Preço:** R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}\n📊 **Estoque Atual:** \`${product.stock || 0}\``,
            inline: false
        });

        // Cria o botão "Estoque" correspondente a este produto
        actionButtons.push({
            type: 2, // Button
            style: 1, // Primary (Blurple)
            label: `Estoque: ${product.name.substring(0, 15)}`, // Trunca nome longo
            custom_id: `store_stock_open_${product.id}`, // ID que abre o menu do produto
            emoji: { name: '📦' }
        });
    });

    // Se a lista estiver vazia (ex: busca sem resultados)
    if (products.length === 0) {
        fields.push({
            name: '🚫 Nenhum produto',
            value: 'Nenhum produto encontrado com este critério.',
            inline: false
        });
    }

    // Monta a descrição do Embed
    const description = searchTerm 
        ? `🔎 Resultados da busca por: \`${searchTerm}\`\nClique no botão correspondente para gerenciar.`
        : 'Gerencie o estoque real dos seus produtos abaixo.\nClique em **Estoque** para editar a quantidade.';

    // Componentes (Botões de Produtos + Navegação)
    const components = [];

    // Linha 1: Botões dos Produtos (se houver produtos)
    if (actionButtons.length > 0) {
        components.push({
            type: 1,
            components: actionButtons
        });
    }

    // Linha 2: Navegação e Busca
    const navRow = {
        type: 1,
        components: [
            {
                type: 2, style: 2, label: '◀ Anterior',
                custom_id: `store_stock_nav_${page - 1}_${searchTerm || ''}`,
                disabled: page === 0
            },
            {
                type: 2, style: 2, label: `Página ${page + 1}/${totalPages}`,
                custom_id: 'noop', disabled: true
            },
            {
                type: 2, style: 2, label: 'Próximo ▶',
                custom_id: `store_stock_nav_${page + 1}_${searchTerm || ''}`,
                disabled: page >= totalPages - 1
            },
            {
                type: 2, style: 3, label: '🔍 Pesquisar', // Success (Green)
                custom_id: 'store_stock_search'
            }
        ]
    };

    // Botão "Limpar Busca" se estiver pesquisando
    if (searchTerm) {
        navRow.components.push({
            type: 2, style: 4, label: '✖ Limpar', // Danger (Red)
            custom_id: 'store_stock_nav_0' // Volta p/ pag 0 sem busca
        });
    }

    components.push(navRow);

    return {
        embeds: [{
            title: '🏭 Gerenciamento de Estoque',
            description: description,
            color: 0x2B2D31, // Dark theme
            fields: fields,
            footer: { text: `Total de Produtos: ${products.length}` } // Apenas visual, o total real está na query
        }],
        components: components
    };
};