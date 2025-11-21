// Arquivo: handlers/buttons/store_manage_cat_visuals_.js
const db = require('../../database');
// Certifique-se que este arquivo UI existe (código abaixo)
const categoryConfigMenu = require('../../ui/store/categoryConfigMenu');
const { V2_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'store_manage_cat_visuals_', // ID Dinâmico
    execute: async (interaction) => {
        // 1. Obter ID da Categoria
        const categoryId = interaction.customId.split('_').pop();

        // 2. Buscar dados atualizados
        const result = await db.query('SELECT * FROM store_categories WHERE id = $1', [categoryId]);
        
        if (result.rows.length === 0) {
            return interaction.reply({ content: '❌ Categoria não encontrada.', ephemeral: true });
        }

        const categoryData = result.rows[0];

        // 3. Gerar o Menu Visual
        const menuComponents = categoryConfigMenu(categoryData);

        // 4. Atualizar a mensagem (CORREÇÃO AQUI: Envolver em objeto components)
        // A flag V2 é essencial para layouts tipo 17
        try {
            await interaction.update({
                components: menuComponents,
                flags: V2_FLAG
            });
        } catch (error) {
            console.error("[Store Visuals] Erro ao atualizar menu:", error);
            // Fallback caso a view falhe
            await interaction.followUp({ 
                content: '❌ Erro ao carregar o menu visual. Verifique se as flags V2 estão ativas.', 
                ephemeral: true 
            });
        }
    }
};