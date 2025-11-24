// Crie em: ui/store/productEditPanel.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = function generateProductEditPanel(product) {
    // Formatação de preço segura
    let priceFormatted = "R$ 0,00";
    try {
        priceFormatted = parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) { priceFormatted = `R$ ${product.price}`; }

    // Interface V2 (Type 17)
    return [
        {
            type: 17,
            components: [
                { type: 10, content: `> **✏️ Editando Produto:** ${product.name}` },
                { type: 10, content: `> **ID:** \`${product.id}\`\n> **Preço Atual:** \`${priceFormatted}\`\n> **Estoque:** ${product.stock === -1 ? 'Infinito' : product.stock}` },
                { type: 14, divider: true, spacing: 2 },
                // Botões de Ação
                {
                    type: 1, 
                    components: [
                        { type: 2, style: 1, label: "Editar Nome", emoji: { name: "📝" }, custom_id: `store_edit_name_${product.id}` },
                        { type: 2, style: 1, label: "Editar Preço", emoji: { name: "💲" }, custom_id: `store_edit_price_${product.id}` },
                        { type: 2, style: 1, label: "Editar Descrição", emoji: { name: "📄" }, custom_id: `store_edit_desc_${product.id}` }
                    ]
                },
                {
                    type: 1, 
                    components: [
                        { type: 2, style: 1, label: "Editar Imagem", emoji: { name: "🖼️" }, custom_id: `store_edit_img_${product.id}` },
                        { type: 2, style: 1, label: "Editar Cor", emoji: { name: "🎨" }, custom_id: `store_edit_color_${product.id}` },
                        { type: 2, style: 1, label: "Editar Estoque", emoji: { name: "📦" }, custom_id: `store_edit_stock_${product.id}` }
                    ]
                },
                { type: 14, divider: true, spacing: 1 },
                // Botão Voltar
                {
                    type: 1,
                    components: [
                        { type: 2, style: 2, label: "Voltar para Lista", emoji: { name: "↩️" }, custom_id: "store_edit_product" }
                    ]
                }
            ]
        }
    ];
};