const db = require('../../database.js');
const stockMenuUI = require('../../ui/store/stockMenu.js');

module.exports = {
    customId: 'store_manage_stock_page_', // O index.js deve rotear IDs que começam com isso
    run: async (client, interaction) => {
        try {
            // Extrai o número da página do ID (ex: store_manage_stock_page_2)
            const page = parseInt(interaction.customId.split('_').pop());

            // Busca TODOS os produtos novamente para garantir consistência
            // (Otimização: em produção massiva, cachearia isso, mas para bot normal query é ok)
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

            // Atualiza a mensagem existente
            await interaction.update(response);

        } catch (error) {
            console.error('Erro na paginação de estoque:', error);
            await interaction.reply({ content: '❌ Erro ao mudar de página.', flags: 64 });
        }
    }
};