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

            // Gera a UI com flag V2 já inclusa no arquivo stockMenu.js
            const response = stockMenuUI(result.rows, 0, true);

            // Update na mensagem original que abriu o modal
            await interaction.update(response);

        } catch (error) {
            console.error('Erro na pesquisa de estoque:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ Erro ao realizar pesquisa.', 
                    flags: (1 << 15) | (1 << 6)
                });
            }
        }
    }
};