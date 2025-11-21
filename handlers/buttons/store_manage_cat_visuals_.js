const db = require('../../database');
const categoryConfigMenu = require('../../ui/store/categoryConfigMenu');

module.exports = {
    customId: 'store_manage_cat_visuals_', // ID Dinâmico
    execute: async (interaction) => {
        const categoryId = interaction.customId.split('_').pop();

        const result = await db.query('SELECT * FROM store_categories WHERE id = $1', [categoryId]);
        
        if (result.rows.length === 0) {
            return interaction.reply({ content: '❌ Categoria não encontrada.', ephemeral: true });
        }

        // Chama o menu de configuração da vitrine
        // Certifique-se que o arquivo ui/store/categoryConfigMenu.js existe!
        const menu = categoryConfigMenu(result.rows[0]);
        await interaction.update(menu);
    }
};