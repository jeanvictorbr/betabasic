const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_open_stock_panel_',
    async execute(interaction) {
        await interaction.deferUpdate();

        const productId = interaction.customId.split('_')[4];
        const res = await db.query('SELECT * FROM store_products WHERE id = $1', [productId]);
        
        if (res.rowCount === 0) {
            return interaction.followUp({ content: 'Produto não encontrado.', ephemeral: true });
        }

        const product = res.rows[0];

        // UI do Painel de Estoque (Construída inline ou extraída para /ui)
        // Usaremos components Type 1 para simular o cabeçalho já que Embeds falham com V2_FLAG
        
        const components = [
            {
                type: 1,
                components: [
                    {
                        type: 2, style: 2, label: `GERENCIAR: ${product.name}`, custom_id: 'info_title', disabled: true
                    }
                ]
            },
            {
                type: 1,
                components: [
                    {
                        type: 2, style: 2, label: `💰 Preço: R$ ${parseFloat(product.price).toFixed(2)}`, custom_id: 'info_price', disabled: true, emoji: { name: '🏷️' }
                    },
                    {
                        type: 2, style: 2, label: `📦 Estoque Atual: ${product.stock}`, custom_id: 'info_stock', disabled: true 
                    }
                ]
            },
            {
                type: 1,
                components: [
                    { type: 2, style: 3, label: 'Adicionar (+)', custom_id: `store_add_stock_${product.id}`, emoji: { name: '➕' } },
                    { type: 2, style: 4, label: 'Remover (-)', custom_id: `store_remove_stock_${product.id}`, emoji: { name: '➖' } },
                    { type: 2, style: 1, label: 'Definir Fixo', custom_id: `store_edit_stock_${product.id}`, emoji: { name: '✏️' } }
                ]
            },
            {
                type: 1,
                components: [
                    { type: 2, style: 2, label: 'Voltar para Lista', custom_id: 'store_manage_products', emoji: { name: '↩️' } }
                ]
            }
        ];

        await interaction.editReply({
            components: components,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};