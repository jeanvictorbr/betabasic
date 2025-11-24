const db = require('../../database.js');
const stockMenu = require('../../ui/store/stockMenu.js');

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = async (interaction) => {
    const guildId = interaction.guild.id;
    
    // Formato do ID: store_stock_page_PAGENUMBER_SEARCHTERM(opcional)
    const parts = interaction.data.custom_id.split('_');
    const page = parseInt(parts[3]);
    const searchTerm = parts.slice(4).join('_') || null; // Reconstrói o termo de busca se houver underscores nele

    let query = '';
    let params = [guildId, 25, page * 25];
    let countQuery = '';
    let countParams = [guildId];

    if (searchTerm) {
        // Lógica com busca
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
        // Lógica padrão
        query = `
            SELECT id, name, price, stock 
            FROM store_products 
            WHERE guild_id = $1 
            ORDER BY id DESC 
            LIMIT $2 OFFSET $3
        `;
        countQuery = 'SELECT COUNT(*) FROM store_products WHERE guild_id = $1';
    }

    // Executa as queries
    const countRes = await db.query(countQuery, countParams);
    const totalProducts = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(totalProducts / 25) || 1;

    const products = await db.query(query, params);

    const payload = await stockMenu(products.rows, page, totalPages, searchTerm);

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