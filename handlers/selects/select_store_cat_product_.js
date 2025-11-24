// Substitua em: handlers/selects/select_store_cat_product_.js
const db = require('../../database.js');
const generateCategoryProductSelect = require('../../ui/store/categoryProductSelect.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js'); // <--- IMPORTANTE
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'select_store_cat_product_',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const parts = interaction.customId.replace('select_store_cat_product_', '').split('_');
        const mode = parts[0]; // 'add' ou 'remove'
        const categoryId = parts[1];
        const productId = interaction.values[0];

        if (productId === 'no_result') return;

        try {
            // 1. Executar Ação no Banco
            let actionMsg = "";
            if (mode === 'add') {
                await db.query('UPDATE store_products SET category_id = $1 WHERE id = $2', [categoryId, productId]);
                actionMsg = `✅ Produto ID **${productId}** adicionado à categoria!`;
            } else {
                await db.query('UPDATE store_products SET category_id = NULL WHERE id = $1', [productId]);
                actionMsg = `🗑️ Produto ID **${productId}** removido da categoria!`;
            }

            // 2. ATUALIZAR VITRINE (Reflete a mudança de categoria)
            try {
                await updateStoreVitrine(interaction.client, interaction.guild.id);
            } catch (err) {
                console.error("Erro ao atualizar vitrine na categoria:", err);
            }

            // 3. Recarregar lista
            const ITEMS_PER_PAGE = 25;
            let countQuery, productsQuery;

            if (mode === 'add') {
                countQuery = 'SELECT COUNT(*) FROM store_products WHERE category_id IS DISTINCT FROM $1';
                productsQuery = 'SELECT id, name, price FROM store_products WHERE category_id IS DISTINCT FROM $1 ORDER BY id ASC LIMIT $2 OFFSET 0';
            } else {
                countQuery = 'SELECT COUNT(*) FROM store_products WHERE category_id = $1';
                productsQuery = 'SELECT id, name, price FROM store_products WHERE category_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0';
            }

            const countRes = await db.query(countQuery, [categoryId]);
            const totalItems = parseInt(countRes.rows[0].count);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

            const products = (await db.query(productsQuery, [categoryId, ITEMS_PER_PAGE])).rows;

            const uiComponents = generateCategoryProductSelect(products, 0, totalPages, mode, categoryId);

            if (uiComponents[0] && uiComponents[0].components && uiComponents[0].components[0]) {
                const oldContent = uiComponents[0].components[0].content;
                uiComponents[0].components[0].content = `> ${actionMsg}\n> 🔄 Vitrine atualizada!\n` + oldContent;
            }

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro action cat:", error);
            await interaction.followUp({ content: '❌ Erro ao atualizar produto.', ephemeral: true });
        }
    }
};