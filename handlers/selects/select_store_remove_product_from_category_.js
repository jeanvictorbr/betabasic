// File: handlers/selects/select_store_remove_product_from_category_.js
const db = require('../../database.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js');

module.exports = {
    customId: 'select_store_remove_product_from_category_',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // O ID da categoria está no final do CustomID (ex: ..._15)
        const categoryId = interaction.customId.split('_').pop();
        // O ID do produto selecionado está no valor do select menu
        const productId = interaction.values[0];

        try {
            // 1. CORREÇÃO CRÍTICA: Alterado de DELETE para UPDATE
            // Apenas define category_id como NULL, mantendo o produto salvo.
            await db.query(
                'UPDATE store_products SET category_id = NULL WHERE id = $1',
                [productId]
            );

            // 2. ATUALIZAÇÃO DA VITRINE EM TEMPO REAL
            // Atualiza a vitrine da categoria afetada para o produto sumir de lá
            try {
                await updateStoreVitrine(interaction.client, interaction.guild.id, categoryId);
            } catch (vitrineError) {
                console.error('Erro ao atualizar vitrine (Remoção):', vitrineError);
            }

            await interaction.editReply(`✅ Produto removido da categoria com sucesso! (Ele continua no seu estoque geral).`);

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro ao desvincular produto da categoria.');
        }
    }
};