// Crie em: ui/store/categoryManageHub.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = function generateCategoryManageHub(category, productCount) {
    return [
        {
            type: 17,
            components: [
                { type: 10, content: `> **📂 Gerenciar Categoria:** ${category.name}` },
                { type: 10, content: `> **ID:** \`${category.id}\`\n> **Produtos Vinculados:** ${productCount}` },
                { type: 14, divider: true, spacing: 2 },
                {
                    type: 1,
                    components: [
                        // Botão para Adicionar (Produtos SEM categoria)
                        { 
                            type: 2, style: 3, // Success (Verde)
                            label: "Adicionar Produtos", 
                            emoji: { name: "➕" }, 
                            custom_id: `store_cat_launch_add_${category.id}` 
                        },
                        // Botão para Remover (Produtos DESTA categoria)
                        { 
                            type: 2, style: 4, // Danger (Vermelho)
                            label: "Remover Produtos", 
                            emoji: { name: "➖" }, 
                            custom_id: `store_cat_launch_remove_${category.id}`,
                            disabled: productCount == 0
                        }
                    ]
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 1,
                    components: [
                        { type: 2, style: 2, label: "Voltar", emoji: { name: "↩️" }, custom_id: "store_manage_categories" }
                    ]
                }
            ]
        }
    ];
};