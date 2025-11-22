// File: handlers/selects/select_store_remove_product.js
const db = require('../../database.js');
const generateManageProductsMenu = require('../../ui/store/manageProductsMenu.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js');
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants.js');

module.exports = {
    customId: 'select_store_remove_product',
    async execute(interaction) {
        await interaction.deferUpdate();

        const productIds = interaction.values;

        try {
            // 1. Verificar quais categorias serão afetadas (para atualizar suas vitrines)
            const checkRes = await db.query(
                'SELECT category_id FROM store_products WHERE id = ANY($1::int[])', 
                [productIds]
            );
            
            const categoriesToUpdate = new Set();
            checkRes.rows.forEach(r => {
                if(r.category_id) categoriesToUpdate.add(r.category_id);
            });

            // 2. Deletar os produtos
            await db.query(
                'DELETE FROM store_products WHERE guild_id = $1 AND id = ANY($2::int[])',
                [interaction.guild.id, productIds]
            );

            // 3. Atualizar Vitrines Afetadas
            // Atualiza a vitrine Global (sempre bom garantir)
            await updateStoreVitrine(interaction.client, interaction.guild.id);
            
            // Atualiza vitrines de categorias específicas (se houver)
            for (const catId of categoriesToUpdate) {
                try {
                    await updateStoreVitrine(interaction.client, interaction.guild.id, catId);
                } catch (e) { console.error(`Erro update vitrine cat ${catId}:`, e); }
            }

            // 4. Recarregar o Menu de Produtos
            const products = (await db.query('SELECT * FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;
            
            await interaction.editReply({
                components: generateManageProductsMenu(products),
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: '❌ Erro ao remover produto.', flags: EPHEMERAL_FLAG });
        }
    }
};