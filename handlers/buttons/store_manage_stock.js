const db = require('../../database.js');
const stockMenuUI = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'store_manage_stock',
    run: async (client, interaction) => {
        try {
            const result = await db.query(`
                SELECT * FROM store_products 
                WHERE guild_id = $1 
                ORDER BY id ASC
            `, [interaction.guild.id]);

            if (result.rows.length === 0) {
                return interaction.reply({ 
                    content: '❌ Você ainda não criou nenhum produto.', 
                    flags: 64 
                });
            }

            const response = stockMenuUI(result.rows, 0); // Página 0, sem pesquisa

            // Se for um clique de botão (como "Voltar" ou "Limpar"), usa update
            if (interaction.message) {
                await interaction.update(response);
            } else {
                // Se for comando slash inicial
                await interaction.reply(response);
            }

        } catch (error) {
            console.error('Erro ao abrir estoque:', error);
            const errPayload = { content: '❌ Erro ao carregar estoque.', flags: 64 };
            if (interaction.deferred || interaction.replied) await interaction.followUp(errPayload);
            else await interaction.reply(errPayload);
        }
    }
};