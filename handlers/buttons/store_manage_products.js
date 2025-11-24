const db = require('../../database.js');
const generateProductsMenu = require('../../ui/store/productsMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_products',
    async execute(interaction) {
        await interaction.deferUpdate();
        
        const products = (await db.query('SELECT * FROM store_products WHERE guild_id = $1 ORDER BY id ASC', [interaction.guild.id])).rows;
        const totalPages = Math.ceil(products.length / 3) || 1;

        // A função generateProductsMenu agora retorna apenas { components: [...] }
        // Isso é compatível com V2_FLAG
        await interaction.editReply({
            ...generateProductsMenu(products, 0, totalPages),
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};