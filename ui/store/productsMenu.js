// File: ui/store/productsMenu.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = (products, page = 0, totalPages = 1) => {
    // Define o limite de produtos por página (Discord permite max 5 action rows, usamos 1 para nav, sobram 4. Vamos usar 3 para garantir espaço)
    const PRODUCTS_PER_PAGE = 3;
    
    // Fatia os produtos para a página atual
    const start = page * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;
    const currentProducts = products.slice(start, end);

    const embeds = [{
        title: '📦 Gerenciamento de Produtos',
        description: 'Aqui estão seus produtos cadastrados. Clique no botão **Estoque** correspondente para gerenciar a quantidade.',
        color: 0x2B2D31,
        fields: currentProducts.map(product => ({
            name: `🏷️ ${product.name}`,
            value: `💰 **Preço:** R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}\n📦 **Estoque:** ${product.stock || 0}`,
            inline: false
        })),
        footer: { text: `Página ${page + 1} de ${totalPages} • Total: ${products.length} produtos` }
    }];

    const components = [];

    // Cria uma linha de botões para CADA produto (Botão de Estoque)
    currentProducts.forEach(product => {
        components.push({
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1, // Primary (Blurple)
                    label: `Estoque: ${product.name.substring(0, 15)}`, // Limita o tamanho do nome
                    custom_id: `store_open_stock_panel_${product.id}`, // ID que abrirá o painel de estoque
                    emoji: { name: '📦' }
                },
                {
                    type: 2,
                    style: 2, // Secondary (Grey)
                    label: 'Editar Infos', 
                    custom_id: `store_edit_product_${product.id}`, // Mantém funcionalidade de editar
                    emoji: { name: '✏️' }
                }
            ]
        });
    });

    // Linha de Navegação (Anterior / Próximo / Criar Novo)
    components.push({
        type: 1,
        components: [
            {
                type: 2,
                style: 2,
                label: '◀',
                custom_id: `store_products_page_${page - 1}`,
                disabled: page === 0
            },
            {
                type: 2,
                style: 2,
                label: '▶',
                custom_id: `store_products_page_${page + 1}`,
                disabled: page >= totalPages - 1
            },
            {
                type: 2,
                style: 3, // Success (Green)
                label: 'Novo Produto',
                custom_id: 'store_add_product',
                emoji: { name: '➕' }
            }
        ]
    });

    return {
        embeds: embeds,
        components: components
    };
};