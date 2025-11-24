const db = require('../../database.js');
const stockMenu = require('../../ui/store/stockMenu.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Pega o valor digitado no modal
    const searchQuery = interaction.data.components[0].components[0].value;

    // Conta resultados da busca
    const countRes = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1 AND name ILIKE $2', [guildId, `%${searchQuery}%`]);
    const totalProducts = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(totalProducts / 25) || 1;

    // Busca a primeira página dos resultados
    const products = await db.query(`
        SELECT id, name, price, stock 
        FROM store_products 
        WHERE guild_id = $1 AND name ILIKE $2
        ORDER BY id DESC 
        LIMIT 25 OFFSET 0
    `, [guildId, `%${searchQuery}%`]);

    // Gera a UI com os resultados e passa o termo de busca para manter estado
    const payload = await stockMenu(products.rows, 0, totalPages, searchQuery);

    return interaction.client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 7, // Update Message
            data: {
                ...payload,
                flags: EPHEMERAL_FLAG
            }
        }
    });
};