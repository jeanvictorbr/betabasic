const db = require('../../database.js');
const stockMenu = require('../../ui/store/stockMenu.js');

// Mantemos as flags, embora editReply gerencie a efemeridade automaticamente com base na mensagem original
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_stock',
    async execute(interaction) {
        // Evita timeout enquanto consulta o DB
        await interaction.deferUpdate();

        const guildId = interaction.guild.id;

        // Conta o total de produtos
        const countRes = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1', [guildId]);
        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / 25) || 1;

        // Busca apenas os primeiros 25 produtos
        const products = await db.query(`
            SELECT id, name, price, stock 
            FROM store_products 
            WHERE guild_id = $1 
            ORDER BY id DESC 
            LIMIT 25 OFFSET 0
        `, [guildId]);

        const payload = await stockMenu(products.rows, 0, totalPages);

        // Usa o método nativo do Discord.js para editar a mensagem
        await interaction.editReply({
            content: payload.content,
            components: payload.components
        });
    }
};