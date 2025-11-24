// Crie em: ui/store/productRemovePanel.js
module.exports = function generateProductRemovePanel(product) {
    let priceFormatted = "R$ 0,00";
    try {
        priceFormatted = parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) { priceFormatted = `R$ ${product.price}`; }

    return [
        {
            type: 17,
            components: [
                { type: 10, content: `> **🗑️ Excluir Produto:** ${product.name}` },
                { type: 10, content: `> **ATENÇÃO:** Esta ação é irreversível. O produto será removido da loja permanentemente.\n> \n> **ID:** ${product.id}\n> **Valor:** ${priceFormatted}` },
                { type: 14, divider: true, spacing: 2 },
                {
                    type: 1,
                    components: [
                        // Botão de Confirmação (Vermelho/Danger)
                        { 
                            type: 2, 
                            style: 4, // Danger
                            label: "CONFIRMAR EXCLUSÃO", 
                            emoji: { name: "🗑️" }, 
                            custom_id: `store_confirm_delete_${product.id}` 
                        },
                        // Botão Cancelar (Cinza/Secondary)
                        { 
                            type: 2, 
                            style: 2, 
                            label: "Cancelar / Voltar", 
                            emoji: { name: "↩️" }, 
                            custom_id: "store_remove_product" 
                        }
                    ]
                }
            ]
        }
    ];
};