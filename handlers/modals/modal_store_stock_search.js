const db = require('../../database.js');
const stockMenu = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'modal_store_stock_search',
    async execute(interaction) {
        // Precisamos deferir o update da mensagem original (onde o botão de busca estava)
        // Isso faz com que o modal feche e a mensagem de fundo seja atualizada
        await interaction.deferUpdate();

        const guildId = interaction.guild.id;
        
        // Pega o valor digitado (fields é o padrão do djs v14 para pegar dados do modal)
        const searchQuery = interaction.fields.getTextInputValue('search_query');

        // Conta resultados
        const countRes = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1 AND name ILIKE $2', [guildId, `%${searchQuery}%`]);
        const totalProducts = parseInt(countRes.rows[0].count);
        const totalPages = Math.ceil(totalProducts / 25) || 1;

        // Busca primeira página
        const products = await db.query(`
            SELECT id, name, price, stock 
            FROM store_products 
            WHERE guild_id = $1 AND name ILIKE $2
            ORDER BY id DESC 
            LIMIT 25 OFFSET 0
        `, [guildId, `%${searchQuery}%`]);

        const payload = await stockMenu(products.rows, 0, totalPages, searchQuery);

        await interaction.editReply({
            content: payload.content,
            components: payload.components
        });
    }
};