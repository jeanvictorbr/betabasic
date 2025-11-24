const db = require('../../database.js');
const stockMenu = require('../../ui/store/stockMenu.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_store_stock_search',
    async execute(interaction) {
        await interaction.deferUpdate();

        const guildId = interaction.guild.id;
        const searchQuery = interaction.fields.getTextInputValue('search_query');

        const countRes = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1 AND name ILIKE $2', [guildId, `%${searchQuery}%`]);
        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / 25) || 1;

        const products = await db.query(`
            SELECT id, name, price, stock 
            FROM store_products 
            WHERE guild_id = $1 AND name ILIKE $2
            ORDER BY id DESC 
            LIMIT 25 OFFSET 0
        `, [guildId, `%${searchQuery}%`]);

        const payload = await stockMenu(products.rows, 0, totalPages, searchQuery);

        await interaction.editReply({
            embeds: payload.embeds,
            components: payload.components,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};