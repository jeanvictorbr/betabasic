// Substitua em: handlers/buttons/store_manage_stock_page_.js
const db = require('../../database.js');
const generateManageStockSelectMenu = require('../../ui/store/manageStockSelectMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    // Captura qualquer botão que comece com este prefixo (tanto _nav_ quanto _go_)
    customId: 'store_manage_stock_', 
    
    async execute(interaction) {
        try {
            // 1. Delay Seguro (Evita "Interação Falhou")
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }

            // 2. Extração Universal da Página Alvo
            // IDs podem ser: store_manage_stock_go_5 OU store_manage_stock_nav_5
            // Pegamos a última parte após o último underscore
            const parts = interaction.customId.split('_');
            const pageStr = parts[parts.length - 1]; // Pega o "5"
            let targetPage = parseInt(pageStr);

            if (isNaN(targetPage) || targetPage < 0) targetPage = 0;

            // 3. Query e Paginação
            const ITEMS_PER_PAGE = 25;
            
            // Contagem total para recalcular limites
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (totalPages < 1) totalPages = 1;

            // Segurança: se pediu pág 10 mas só tem 5, vai pra 5
            if (targetPage >= totalPages) targetPage = totalPages - 1;

            const offset = targetPage * ITEMS_PER_PAGE;

            // 4. Buscar Produtos da Página Certa
            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET $3', 
                [interaction.guild.id, ITEMS_PER_PAGE, offset]
            )).rows;

            // 5. Gerar Nova Interface
            const uiComponents = generateManageStockSelectMenu(products, targetPage, totalPages, false);

            // 6. Editar a Mensagem (Garante que mude visualmente)
            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro na paginação:", error);
            // Tenta recuperar se der erro
            if (!interaction.replied) {
                await interaction.followUp({ content: '❌ Erro ao carregar página. Tente fechar e abrir novamente.', ephemeral: true });
            }
        }
    }
};