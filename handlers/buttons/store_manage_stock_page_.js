// Substitua em: handlers/buttons/store_manage_stock_page_.js
const db = require('../../database.js');
const generateManageStockSelectMenu = require('../../ui/store/manageStockSelectMenu.js');

module.exports = {
    customId: 'store_manage_stock_page_',
    
    async execute(interaction) {
        try {
            // Extração Robusta: Remove o prefixo e usa parseInt.
            // "store_manage_stock_page_2_arrow" -> "2_arrow" -> parseInt pega 2.
            const pageStr = interaction.customId.replace('store_manage_stock_page_', '');
            let targetPage = parseInt(pageStr);

            if (isNaN(targetPage) || targetPage < 0) targetPage = 0;

            const ITEMS_PER_PAGE = 25;
            const offset = targetPage * ITEMS_PER_PAGE;

            // 1. Contagem e Validação
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (totalPages < 1) totalPages = 1;

            // Corrige se a página pedida não existe mais
            if (targetPage >= totalPages) targetPage = totalPages - 1;

            // 2. Busca de Dados
            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3', 
                [interaction.guild.id, ITEMS_PER_PAGE, offset]
            )).rows;

            // 3. Gera UI e Atualiza
            const uiComponents = generateManageStockSelectMenu(products, targetPage, totalPages, false);

            await interaction.update({
                components: uiComponents
            });

        } catch (error) {
            console.error("Erro na paginação de estoque:", error);
            // Tenta responder apenas se a interação ainda estiver aberta
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erro ao mudar página.', ephemeral: true });
            }
        }
    }
};