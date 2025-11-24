// Substitua em: handlers/buttons/store_manage_stock_page_.js
const db = require('../../database.js');
const generateManageStockSelectMenu = require('../../ui/store/manageStockSelectMenu.js');

module.exports = {
    // Captura qualquer botão que comece com este ID
    customId: 'store_manage_stock_page_',
    
    async execute(interaction) {
        // Extrai o número da página do ID do botão (ex: store_manage_stock_page_5 -> 5)
        const pageStr = interaction.customId.replace('store_manage_stock_page_', '');
        let targetPage = parseInt(pageStr);

        if (isNaN(targetPage) || targetPage < 0) targetPage = 0;

        const ITEMS_PER_PAGE = 25;
        const offset = targetPage * ITEMS_PER_PAGE;

        try {
            // 1. Contar total de produtos para refazer a paginação correta
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

            // Validação de segurança: se a página pedida não existe mais, vai para a última
            if (targetPage >= totalPages) targetPage = totalPages - 1;

            // 2. Buscar os produtos EXATOS da página solicitada
            // ORDER BY id é crucial para que a paginação não pule itens
            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3', 
                [interaction.guild.id, ITEMS_PER_PAGE, offset]
            )).rows;

            // 3. Gerar a nova UI com os botões numéricos atualizados
            const uiComponents = generateManageStockSelectMenu(products, targetPage, totalPages, false);

            // 4. Atualizar a mensagem (sem criar uma nova)
            // Isso remove o "piscar" de mensagem nova e apenas troca os botões/menu
            await interaction.update({
                components: uiComponents
            });

        } catch (error) {
            console.error("Erro na paginação:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Erro ao mudar de página. Tente reabrir o menu.', ephemeral: true });
            }
        }
    }
};