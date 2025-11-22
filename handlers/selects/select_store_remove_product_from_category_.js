// File: handlers/selects/select_store_remove_product_from_category_.js
const db = require('../../database.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js');

module.exports = {
    customId: 'select_store_remove_product_from_category_',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const categoryId = interaction.customId.split('_').pop(); // ID da categoria atual
        const productId = interaction.values[0]; // ID do produto selecionado

        try {
            // --- CORREÇÃO AQUI ---
            // Antes: DELETE FROM store_products WHERE id = $1 (Isso apagava o produto!)
            // Agora: Apenas removemos a categoria dele (NULL)
            await db.query(
                'UPDATE store_products SET category_id = NULL WHERE id = $1',
                [productId]
            );

            // Atualiza a vitrine da categoria afetada (para remover o produto visualmente dela)
            await updateStoreVitrine(interaction.client, interaction.guild.id, categoryId);

            await interaction.editReply(`✅ Produto removido da categoria com sucesso! (O produto continua existindo na loja, sem categoria).`);

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro ao remover produto da categoria.');
        }
    }
};