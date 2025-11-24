// Crie em: handlers/buttons/store_confirm_delete_.js
const db = require('../../database.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js'); // <--- IMPORTANTE
const generateRemoveProductSelectMenu = require('../../ui/store/removeProductSelectMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_confirm_delete_',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const productId = interaction.customId.split('_').pop();

        try {
            // 1. Deletar do Banco
            await db.query('DELETE FROM store_products WHERE id = $1 AND guild_id = $2', [productId, interaction.guild.id]);

            // 2. ATUALIZAR A VITRINE (Remove o produto visualmente)
            try {
                await updateStoreVitrine(interaction.client, interaction.guild.id);
            } catch (err) {
                console.error("Erro ao atualizar vitrine no delete:", err);
            }

            // 3. Atualizar o Menu de Remoção (Recarregar lista)
            const ITEMS_PER_PAGE = 25;
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (totalPages < 1) totalPages = 1;

            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0', 
                [interaction.guild.id, ITEMS_PER_PAGE]
            )).rows;

            const uiComponents = generateRemoveProductSelectMenu(products, 0, totalPages, false);

            if (uiComponents[0] && uiComponents[0].components && uiComponents[0].components[0]) {
                uiComponents[0].components[0].content = `> 🗑️ **Produto ${productId} deletado!** A vitrine foi atualizada.\n> Selecione outro para remover:`;
            }

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao deletar produto:", error);
            await interaction.followUp({ content: 'Erro ao deletar produto.', ephemeral: true });
        }
    }
};