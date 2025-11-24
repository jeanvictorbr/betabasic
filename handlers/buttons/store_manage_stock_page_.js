// Substitua em: handlers/buttons/store_manage_stock_page_.js
const db = require('../../database.js');
const generateManageStockSelectMenu = require('../../ui/store/manageStockSelectMenu.js');

module.exports = {
    // O Index vai capturar qualquer ID que comece com isso
    customId: 'store_manage_stock_page_',
    
    async execute(interaction) {
        try {
            // 1. Descobrir qual página o usuário quer
            // O ID do botão vem como "store_manage_stock_page_1", "store_manage_stock_page_2", etc.
            // Removemos o texto para pegar só o número.
            const targetPageStr = interaction.customId.replace('store_manage_stock_page_', '');
            let targetPage = parseInt(targetPageStr);

            // Segurança básica
            if (isNaN(targetPage) || targetPage < 0) targetPage = 0;

            const ITEMS_PER_PAGE = 25;
            const offset = targetPage * ITEMS_PER_PAGE; // Ex: Pág 1 * 25 = Pula 25 itens (pega do 26 ao 50)

            // 2. Contar total de itens para saber quantas páginas existem
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            
            // Calcula total de páginas (ex: 30 itens / 25 = 1.2 -> teto é 2 páginas)
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (totalPages < 1) totalPages = 1;

            // Se o usuário tentar ir para uma página que não existe mais (ex: apagou produtos), joga para a última
            if (targetPage >= totalPages) targetPage = totalPages - 1;

            // 3. Buscar a NOVA LEVA de produtos
            // A ordem OBRIGATORIAMENTE deve ser a mesma sempre (ORDER BY id) para a paginação funcionar
            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3', 
                [interaction.guild.id, ITEMS_PER_PAGE, offset]
            )).rows;

            // 4. Gerar a nova interface
            const uiComponents = generateManageStockSelectMenu(products, targetPage, totalPages, false);

            // 5. ATUALIZAR a mensagem (Mágica aqui: 'update' é mais suave que 'editReply' para botões)
            await interaction.update({
                components: uiComponents
                // Não precisamos reenviar as flags se a mensagem já for Ephemeral, mas por segurança o update mantém o estado.
            });

        } catch (error) {
            console.error("Erro ao paginar estoque:", error);
            // Se der erro crítico, tenta avisar sem quebrar tudo
            if (!interaction.replied) {
                await interaction.reply({ content: '⚠️ Erro ao mudar de página. Tente fechar e abrir o menu novamente.', ephemeral: true });
            }
        }
    }
};