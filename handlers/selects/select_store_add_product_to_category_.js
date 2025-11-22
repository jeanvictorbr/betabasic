// Crie em: handlers/selects/select_store_add_product_to_category_.js
const db = require('../../database.js');
const manageCategoryProductsHandler = require('../buttons/store_manage_category_products_.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js');


module.exports = {
    customId: 'select_store_add_product_to_category_',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const categoryId = interaction.customId.split('_').pop();
        const productId = interaction.values[0];

        try {
            // Atualiza o produto para pertencer a esta categoria
            await db.query(
                'UPDATE store_products SET category_id = $1 WHERE id = $2',
                [categoryId, productId]
            );

            // ATUALIZAÇÃO DA VITRINE EM TEMPO REAL
            try {
                await updateStoreVitrine(interaction.client, interaction.guild.id, categoryId);
            } catch (vitrineError) {
                console.error('Erro ao atualizar vitrine (Adição):', vitrineError);
            }

            await interaction.editReply(`✅ Produto adicionado à categoria com sucesso! A vitrine foi atualizada.`);

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro ao adicionar produto à categoria.');
        }
    }
};