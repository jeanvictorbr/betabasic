const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (products, page = 0, totalPages = 1, searchTerm = null) => {
    // Formata os produtos
    const options = products.map(product => ({
        label: `📦 ${product.name}`,
        description: `Preço: R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')} | Estoque: ${product.stock || 0}`,
        value: `store_stock_sel_${product.id}`,
        emoji: { name: '📦' }
    }));

    if (options.length === 0) {
        options.push({
            label: 'Nenhum produto encontrado',
            value: 'no_product',
            description: 'Tente outra busca ou adicione produtos.',
            emoji: { name: '🚫' }
        });
    }

    // Componentes
    const components = [
        {
            type: 1,
            components: [
                {
                    type: 3, // String Select Menu
                    custom_id: 'select_store_manage_stock',
                    options: options,
                    placeholder: 'Selecione um produto para gerenciar...',
                    min_values: 1,
                    max_values: 1,
                    disabled: options[0].value === 'no_product'
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2, 
                    style: 2, // Secondary
                    label: '◀ Anterior',
                    custom_id: `store_stock_page_${page - 1}_${searchTerm ? searchTerm : ''}`,
                    disabled: page === 0
                },
                {
                    type: 2,
                    style: 1, // Primary
                    label: `Página ${page + 1}/${totalPages}`,
                    custom_id: 'store_stock_page_noop',
                    disabled: true
                },
                {
                    type: 2, 
                    style: 2, // Secondary
                    label: 'Próximo ▶',
                    custom_id: `store_stock_page_${page + 1}_${searchTerm ? searchTerm : ''}`,
                    disabled: page >= totalPages - 1
                },
                {
                    type: 2, 
                    style: 3, // Success
                    label: '🔍 Pesquisar',
                    custom_id: 'store_stock_search',
                    disabled: false
                }
            ]
        }
    ];

    if (searchTerm) {
        components[1].components.push({
            type: 2,
            style: 4, // Danger
            label: 'Limpar Busca',
            custom_id: 'store_stock_page_0',
        });
    }

    // Criação do Embed Manual (JSON) para substituir o 'content'
    const embed = {
        title: '📊 Gerenciamento de Estoque',
        description: searchTerm 
            ? `🔎 Resultados para: \`${searchTerm}\`\nSelecione um produto abaixo para editar.`
            : `Mostrando produtos **${page * 25 + 1}** a **${Math.min((page + 1) * 25, (page * 25) + products.length)}**.`,
        color: 0x2B2D31 // Cor escura padrão do Discord
    };

    return {
        embeds: [embed],
        components: components
    };
};