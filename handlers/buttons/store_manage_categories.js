// Substitua em: handlers/buttons/store_manage_categories.js
const db = require('../../database.js');
const generateCategoriesMenu = require('../../ui/store/categoriesMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_manage_categories',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        try {
            // Buscar todas as categorias para exibir a lista simples
            const categories = (await db.query(
                'SELECT id, name FROM store_categories WHERE guild_id = $1 ORDER BY id ASC', 
                [interaction.guild.id]
            )).rows;

            // Gerar a UI com os botões de Editar e Remover
            const uiComponents = generateCategoriesMenu(categories);

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao abrir menu de categorias:", error);
            await interaction.followUp({ content: '❌ Erro ao carregar categorias.', ephemeral: true });
        }
    }
};