// Substitua o conteúdo em: ui/store/manageCategoryProductsMenu.js
const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = function generateManageCategoryProductsMenu(category, assignedProducts = [], unassignedProducts = []) {

    const assignedOptions = assignedProducts.map(p => ({
        label: p.name,
        description: `ID: ${p.id} | R$ ${p.price}`,
        value: p.id.toString(),
        emoji: { name: "❌" } // Visual indicativo de remoção
    }));

    const unassignedOptions = unassignedProducts.map(p => ({
        label: p.name,
        description: `ID: ${p.id} | R$ ${p.price}`,
        value: p.id.toString(),
        emoji: { name: "➕" } // Visual indicativo de adição
    }));

    const maxRemoveValues = Math.max(1, Math.min(25, assignedOptions.length));
    const maxAddValues = Math.max(1, Math.min(25, unassignedOptions.length));

    // --- CORREÇÃO DO ID DO SELECT ---
    // Mudamos de 'select_store_remove_product_from_category_' para 'select_store_cat_unlink_'
    // Isso evita que o bot confunda com 'select_store_remove_product' (Excluir Produto da Loja)
    const removeSelect = new StringSelectMenuBuilder()
        .setCustomId(`select_store_cat_unlink_${category.id}`) 
        .setPlaceholder('Selecione produtos para REMOVER desta categoria')
        .addOptions(assignedOptions.length > 0 ? assignedOptions : [{ label: 'Nenhum produto para remover.', value: 'none' }])
        .setDisabled(assignedOptions.length === 0)
        .setMinValues(1)
        .setMaxValues(maxRemoveValues);

    const addSelect = new StringSelectMenuBuilder()
        .setCustomId(`select_store_add_product_to_category_${category.id}`)
        .setPlaceholder('Selecione produtos para ADICIONAR a esta categoria')
        .addOptions(unassignedOptions.length > 0 ? unassignedOptions : [{ label: 'Nenhum produto sem categoria.', value: 'none' }])
        .setDisabled(unassignedOptions.length === 0)
        .setMinValues(1)
        .setMaxValues(maxAddValues);

    return [
        {
            "type": 17, "accent_color": 15105570,
            "components": [
                { "type": 10, "content": `## 📂 Gerenciando Categoria: ${category.name}` },
                { "type": 10, "content": `> Use os menus abaixo para organizar seus produtos.` },
                
                { "type": 14, "divider": true, "spacing": 1 },
                { "type": 10, "content": "### 📥 Adicionar à Categoria:" },
                new ActionRowBuilder().addComponents(addSelect).toJSON(),
                
                { "type": 14, "divider": true, "spacing": 1 },
                { "type": 10, "content": "### 📤 Remover da Categoria (Desvincular):" },
                new ActionRowBuilder().addComponents(removeSelect).toJSON(),
                
                { "type": 14, "divider": true, "spacing": 2 },
                {
                    "type": 1, "components": [
                        { "type": 2, "style": ButtonStyle.Secondary, "label": "Voltar", "emoji": { "name": "↩️" }, "custom_id": "store_manage_categories" }
                    ]
                }
            ]
        }
    ];
};