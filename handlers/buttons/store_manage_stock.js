const db = require('../../database.js');
const stockMenu = require('../../ui/store/stockMenu.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock',
    async execute(interaction) {
        await interaction.deferUpdate();

        const guildId = interaction.guild.id;

        const countRes = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1', [guildId]);
        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / 25) || 1;

        const products = await db.query(`
            SELECT id, name, price, stock 
            FROM store_products 
            WHERE guild_id = $1 
            ORDER BY id DESC 
            LIMIT 25 OFFSET 0
        `, [guildId]);

        const payload = await stockMenu(products.rows, 0, totalPages);

        await interaction.editReply({
            embeds: payload.embeds,
            components: payload.components,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};