const db = require('../../database.js');
const stockMenuUI = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'store_manage_stock_page_',
    async execute(interaction) {
        try {
            const page = parseInt(interaction.customId.split('_').pop());

            const result = await db.query(`
                SELECT * FROM store_products 
                WHERE guild_id = $1 
                ORDER BY id ASC
            `, [interaction.guild.id]);

            // Se não achar nada (raro na paginação, mas seguro), mantém flag V2
            if (result.rows.length === 0) {
                return interaction.update({ 
                    content: "❌ Nenhum produto encontrado na loja.", 
                    components: [],
                    flags: (1 << 15) | (1 << 6)
                });
            }

            const response = stockMenuUI(result.rows, page);
            await interaction.update(response);

        } catch (error) {
            console.error('Erro na paginação de estoque:', error);
            // Erro silencioso para o usuário não ver spam, ou ephemeral V2
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ Erro ao mudar de página.', 
                    flags: (1 << 15) | (1 << 6)
                });
            }
        }
    }
};