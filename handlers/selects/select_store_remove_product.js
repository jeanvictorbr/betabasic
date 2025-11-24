// Substitua em: handlers/selects/select_store_remove_product.js
const db = require('../../database.js');
const generateProductRemovePanel = require('../../ui/store/productRemovePanel.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'select_store_remove_product',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const productId = interaction.values[0];
        if (productId === 'no_result') return;

        try {
            const product = (await db.query('SELECT * FROM store_products WHERE id = $1', [productId])).rows[0];

            if (!product) {
                return interaction.followUp({ content: '❌ Produto já não existe mais.', ephemeral: true });
            }

            const uiComponents = generateProductRemovePanel(product);

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao selecionar produto para remover:", error);
        }
    }
};