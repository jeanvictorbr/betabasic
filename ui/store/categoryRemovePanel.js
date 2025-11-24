// Crie em: ui/store/categoryRemovePanel.js
module.exports = function generateCategoryRemovePanel(category) {
    return [
        {
            type: 17,
            components: [
                { type: 10, content: `> **🗑️ Excluir Categoria:** ${category.name}` },
                { type: 10, content: `> **ATENÇÃO:** Ao confirmar, a categoria será apagada permanentemente.\n> Se houver uma mensagem de vitrine vinculada, ela também será apagada do canal.` },
                { type: 14, divider: true, spacing: 2 },
                {
                    type: 1,
                    components: [
                        // Botão Confirmar (Leva ao handler de delete real)
                        { 
                            type: 2, style: 4, 
                            label: "CONFIRMAR EXCLUSÃO", 
                            emoji: { name: "🗑️" }, 
                            custom_id: `store_confirm_delete_cat_${category.id}` 
                        },
                        // Botão Cancelar
                        { 
                            type: 2, style: 2, 
                            label: "Cancelar", 
                            emoji: { name: "↩️" }, 
                            custom_id: "store_remove_category" 
                        }
                    ]
                }
            ]
        }
    ];
};