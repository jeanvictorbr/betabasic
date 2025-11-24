const db = require('../../database.js');
const stockMenuUI = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'store_manage_stock_page_',
    async execute(interaction) {
        try {
            // Extrai o número da página do ID (ex: store_manage_stock_page_2)
            const page = parseInt(interaction.customId.split('_').pop());

            const result = await db.query(`
                SELECT * FROM store_products 
                WHERE guild_id = $1 
                ORDER BY id ASC
            `, [interaction.guild.id]);

            if (result.rows.length === 0) {
                return interaction.update({ content: "❌ Nenhum produto encontrado na loja.", components: [] });
            }

            // Gera a UI para a página solicitada
            const response = stockMenuUI(result.rows, page);

            await interaction.update(response);

        } catch (error) {
            console.error('Erro na paginação de estoque:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao mudar de página.', flags: 64 });
            }
        }
    }
};