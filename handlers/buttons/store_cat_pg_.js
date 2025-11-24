// Crie em: handlers/buttons/store_cat_pg_.js
const db = require('../../database.js');
const generateCategoryProductSelect = require('../../ui/store/categoryProductSelect.js');

module.exports = {
    customId: 'store_cat_pg_', // store_cat_pg_add_5_2 (Modo_Cat_Pagina)
    async execute(interaction) {
        try {
            const parts = interaction.customId.replace('store_cat_pg_', '').split('_');
            const mode = parts[0];
            const categoryId = parts[1];
            let targetPage = parseInt(parts[2]);
            if (isNaN(targetPage) || targetPage < 0) targetPage = 0;

            const ITEMS_PER_PAGE = 25;
            const offset = targetPage * ITEMS_PER_PAGE;

            // Mesma lógica de query do launcher
            let countQuery, productsQuery;
            if (mode === 'add') {
                countQuery = 'SELECT COUNT(*) FROM store_products WHERE category_id IS DISTINCT FROM $1';
                productsQuery = 'SELECT id, name, price FROM store_products WHERE category_id IS DISTINCT FROM $1 ORDER BY id ASC LIMIT $2 OFFSET $3';
            } else {
                countQuery = 'SELECT COUNT(*) FROM store_products WHERE category_id = $1';
                productsQuery = 'SELECT id, name, price FROM store_products WHERE category_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3';
            }

            const countRes = await db.query(countQuery, [categoryId]);
            const totalItems = parseInt(countRes.rows[0].count);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

            if (targetPage >= totalPages) targetPage = totalPages - 1;

            const products = (await db.query(productsQuery, [categoryId, ITEMS_PER_PAGE, offset])).rows;

            const uiComponents = generateCategoryProductSelect(products, targetPage, totalPages, mode, categoryId);

            await interaction.update({ components: uiComponents });

        } catch (error) {
            console.error("Erro paginação cat:", error);
            if(!interaction.replied) await interaction.reply({ content: 'Erro ao mudar página.', ephemeral: true });
        }
    }
};