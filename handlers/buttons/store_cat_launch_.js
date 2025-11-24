// Crie em: handlers/buttons/store_cat_launch_.js
const db = require('../../database.js');
const generateCategoryProductSelect = require('../../ui/store/categoryProductSelect.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_cat_launch_', // Captura store_cat_launch_add_5
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        // Parse do ID: store_cat_launch_MODE_CATID
        const parts = interaction.customId.replace('store_cat_launch_', '').split('_');
        const mode = parts[0]; // 'add' ou 'remove'
        const categoryId = parts[1];

        const ITEMS_PER_PAGE = 25;

        try {
            let countQuery, productsQuery;

            if (mode === 'add') {
                // Produtos SEM categoria ou de OUTRA categoria (depende da sua regra, assumo 'sem categoria' ou 'qualquer um')
                // Geralmente adicionamos produtos que estão 'soltos' (category_id IS NULL)
                // Ou podemos roubar de outras categorias. Vamos listar TODOS que NÃO estão nesta categoria.
                countQuery = 'SELECT COUNT(*) FROM store_products WHERE category_id IS DISTINCT FROM $1';
                productsQuery = 'SELECT id, name, price FROM store_products WHERE category_id IS DISTINCT FROM $1 ORDER BY id ASC LIMIT $2 OFFSET 0';
            } else {
                // Produtos DESTA categoria
                countQuery = 'SELECT COUNT(*) FROM store_products WHERE category_id = $1';
                productsQuery = 'SELECT id, name, price FROM store_products WHERE category_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0';
            }

            const countRes = await db.query(countQuery, [categoryId]);
            const totalItems = parseInt(countRes.rows[0].count);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

            const products = (await db.query(productsQuery, [categoryId, ITEMS_PER_PAGE])).rows;

            const uiComponents = generateCategoryProductSelect(products, 0, totalPages, mode, categoryId);

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error(`Erro launcher cat ${mode}:`, error);
            await interaction.followUp({ content: '❌ Erro ao carregar lista.', ephemeral: true });
        }
    }
};