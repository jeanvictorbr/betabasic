const db = require('../../database.js');
const generateProductsMenu = require('../../ui/store/productsMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_products_page_',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        const page = parseInt(interaction.customId.split('_')[3]);
        const products = (await db.query('SELECT * FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;
        const totalPages = Math.ceil(products.length / 3) || 1;

        await interaction.editReply({
            ...generateProductsMenu(products, page, totalPages),
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};