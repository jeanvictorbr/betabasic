// Arquivo: handlers/selects/select_store_remove_product_from_category_.js
const db = require('../../database.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js');

// Precisamos importar o handler do menu para recarregá-lo no final
// NOTA: Ajuste o caminho se necessário, baseando-se na sua estrutura
const manageCategoryProductsHandler = require('../buttons/store_manage_category_products_.js'); 

module.exports = {
    // Novo ID correspondente ao arquivo UI acima
    customId: 'select_store_cat_unlink_', 
    async execute(interaction) {
        await interaction.deferUpdate();

        // ID agora está na posição 4: select_store_cat_unlink_ID
        const categoryId = interaction.customId.split('_')[4]; 
        const productIds = interaction.values;

        try {
            // 1. DESVINCULAR (UPDATE) EM VEZ DE DELETAR
            // Apenas setamos a categoria como NULL
            await db.query(
                'UPDATE store_products SET category_id = NULL WHERE guild_id = $1 AND id = ANY($2::int[])',
                [interaction.guild.id, productIds]
            );

            // 2. ATUALIZAR VITRINE (Em tempo real)
            // Atualiza a vitrine desta categoria específica para os produtos sumirem dela visualmente
            try {
                await updateStoreVitrine(interaction.client, interaction.guild.id, categoryId);
            } catch (vitrineError) {
                console.error('Erro ao atualizar vitrine após remoção:', vitrineError);
            }

            // 3. ATUALIZAR O MENU DE GERENCIAMENTO
            // Simulamos a chamada do botão para recarregar a tela com os dados novos
            interaction.customId = `store_manage_category_products_${categoryId}`;
            if (manageCategoryProductsHandler && manageCategoryProductsHandler.execute) {
                await manageCategoryProductsHandler.execute(interaction);
            } else {
                // Fallback caso o handler não seja carregado corretamente
                await interaction.followUp({ content: "✅ Produtos removidos da categoria com sucesso!", ephemeral: true });
            }

        } catch (error) {
            console.error("Erro ao desvincular produtos:", error);
            await interaction.followUp({ content: "❌ Erro ao atualizar a categoria dos produtos.", ephemeral: true });
        }
    }
};