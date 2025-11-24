const db = require('../../database.js');
const stockMenuUI = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'store_manage_stock',
    async execute(interaction) {
        try {
            const result = await db.query(`
                SELECT * FROM store_products 
                WHERE guild_id = $1 
                ORDER BY id ASC
            `, [interaction.guild.id]);

            if (result.rows.length === 0) {
                // Resposta de erro também precisa ser V2 + Ephemeral
                return interaction.reply({ 
                    content: '❌ Você ainda não criou nenhum produto.', 
                    flags: (1 << 15) | (1 << 6) 
                });
            }

            const response = stockMenuUI(result.rows, 0);

            if (interaction.message) {
                await interaction.update(response);
            } else {
                await interaction.reply(response);
            }

        } catch (error) {
            console.error('Erro ao abrir estoque:', error);
            const errPayload = { 
                content: '❌ Erro ao carregar estoque.', 
                flags: (1 << 15) | (1 << 6) // V2 + Ephemeral
            };
            if (interaction.deferred || interaction.replied) await interaction.followUp(errPayload);
            else await interaction.reply(errPayload);
        }
    }
};