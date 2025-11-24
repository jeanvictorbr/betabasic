const db = require('../../database.js');
const stockList = require('../../ui/store/stockList.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'modal_store_stock_search',
    async execute(interaction) {
        await interaction.deferUpdate();
        const guildId = interaction.guild.id;
        const queryText = interaction.fields.getTextInputValue('search_query');

        // Conta resultados da busca
        const countRes = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1 AND name ILIKE $2', [guildId, `%${queryText}%`]);
        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / 3) || 1;

        // Busca itens filtrados (Pagina 0)
        const products = await db.query(`
            SELECT id, name, price, stock 
            FROM store_products 
            WHERE guild_id = $1 AND name ILIKE $2
            ORDER BY id ASC 
            LIMIT 3 OFFSET 0
        `, [guildId, `%${queryText}%`]);

        const payload = await stockList(products.rows, 0, totalPages, queryText);

        await interaction.editReply({
            embeds: payload.embeds,
            components: payload.components,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};