const db = require('../../database.js');
const stockList = require('../../ui/store/stockList.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_stock_nav_',
    async execute(interaction) {
        await interaction.deferUpdate();
        const guildId = interaction.guild.id;

        // ID format: store_stock_nav_PAGE_SEARCHTERM
        const parts = interaction.customId.split('_');
        const page = parseInt(parts[3]);
        const searchTerm = parts.slice(4).join('_') || null;

        let query, countQuery;
        let params = [guildId, 3, page * 3]; // Limit 3, Offset Page*3
        let countParams = [guildId];

        if (searchTerm) {
            query = `SELECT id, name, price, stock FROM store_products WHERE guild_id = $1 AND name ILIKE $4 ORDER BY id ASC LIMIT $2 OFFSET $3`;
            countQuery = `SELECT COUNT(*) FROM store_products WHERE guild_id = $1 AND name ILIKE $2`;
            params.push(`%${searchTerm}%`);
            countParams.push(`%${searchTerm}%`);
        } else {
            query = `SELECT id, name, price, stock FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3`;
            countQuery = `SELECT COUNT(*) FROM store_products WHERE guild_id = $1`;
        }

        const countRes = await db.query(countQuery, countParams);
        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / 3) || 1;

        const products = await db.query(query, params);
        const payload = await stockList(products.rows, page, totalPages, searchTerm);

        await interaction.editReply({
            embeds: payload.embeds,
            components: payload.components,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};