const db = require('../../database.js');
const stockMenu = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'store_stock_page_',
    async execute(interaction) {
        await interaction.deferUpdate();

        const guildId = interaction.guild.id;
        
        // Formato do ID: store_stock_page_PAGENUMBER_SEARCHTERM(opcional)
        const parts = interaction.customId.split('_');
        const page = parseInt(parts[3]);
        const searchTerm = parts.slice(4).join('_') || null;

        let query = '';
        let params = [guildId, 25, page * 25];
        let countQuery = '';
        let countParams = [guildId];

        if (searchTerm) {
            query = `
                SELECT id, name, price, stock 
                FROM store_products 
                WHERE guild_id = $1 AND name ILIKE $4
                ORDER BY id DESC 
                LIMIT $2 OFFSET $3
            `;
            params.push(`%${searchTerm}%`);

            countQuery = 'SELECT COUNT(*) FROM store_products WHERE guild_id = $1 AND name ILIKE $2';
            countParams.push(`%${searchTerm}%`);
        } else {
            query = `
                SELECT id, name, price, stock 
                FROM store_products 
                WHERE guild_id = $1 
                ORDER BY id DESC 
                LIMIT $2 OFFSET $3
            `;
            countQuery = 'SELECT COUNT(*) FROM store_products WHERE guild_id = $1';
        }

        const countRes = await db.query(countQuery, countParams);
        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / 25) || 1;

        const products = await db.query(query, params);

        const payload = await stockMenu(products.rows, page, totalPages, searchTerm);

        await interaction.editReply({
            content: payload.content,
            components: payload.components
        });
    }
};