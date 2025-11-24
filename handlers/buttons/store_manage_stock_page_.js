// Crie em: handlers/buttons/store_manage_stock_page_.js
const db = require('../../database.js');
const generateManageStockSelectMenu = require('../../ui/store/manageStockSelectMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock_page_',
    async execute(interaction) {
        await interaction.deferUpdate();

        // Extrair a página do ID (ex: store_manage_stock_page_1)
        const page = parseInt(interaction.customId.split('_').pop());
        const ITEMS_PER_PAGE = 25;
        const offset = page * ITEMS_PER_PAGE;

        // 1. Contar total
        const countResult = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

        // 2. Buscar produtos da página solicitada
        const products = (await db.query(
            'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3', 
            [interaction.guild.id, ITEMS_PER_PAGE, offset]
        )).rows;

        // 3. Gerar UI atualizada
        const uiComponents = generateManageStockSelectMenu(products, page, totalPages, false);

        await interaction.editReply({
            components: uiComponents,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};