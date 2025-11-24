const db = require('../../database.js');
const stockMenuUI = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'modal_store_stock_search',
    async execute(interaction) {
        try {
            const query = interaction.fields.getTextInputValue('search_query');

            const result = await db.query(`
                SELECT * FROM store_products 
                WHERE guild_id = $1 
                AND name ILIKE $2
                ORDER BY id ASC
            `, [interaction.guild.id, `%${query}%`]);

            // Gera a UI na página 0 dos resultados, marcando isSearch como true
            const response = stockMenuUI(result.rows, 0, true);

            // Atualiza a mensagem original
            await interaction.update(response);

        } catch (error) {
            console.error('Erro na pesquisa de estoque:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao realizar pesquisa.', flags: 64 });
            }
        }
    }
};