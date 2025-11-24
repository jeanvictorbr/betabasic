// Crie em: handlers/buttons/store_manage_stock_page_.js
const db = require('../../database.js');
const generateManageStockSelectMenu = require('../../ui/store/manageStockSelectMenu.js');

// Flags padrão do projeto
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    // O Index.js vai rotear qualquer coisa que comece com isso
    customId: 'store_manage_stock_page_',
    
    async execute(interaction) {
        // Garante deferimento apenas se ainda não foi feito
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate().catch(() => {});
        }

        try {
            // 1. Extração Segura da Página
            // Remove o prefixo fixo para pegar apenas o número, evitando erros com split('_')
            const pageStr = interaction.customId.replace('store_manage_stock_page_', '');
            let page = parseInt(pageStr);

            if (isNaN(page) || page < 0) page = 0; // Fallback de segurança

            const ITEMS_PER_PAGE = 25;

            // 2. Contagem Total (Essencial para calcular limites)
            const countResult = await db.query('SELECT COUNT(*) FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            
            // Calcula total de páginas
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

            // 3. Correção de Limites (Se o usuário clicar rápido e a página não existir mais)
            if (page >= totalPages) page = totalPages - 1;
            if (page < 0) page = 0;

            const offset = page * ITEMS_PER_PAGE;

            // 4. Busca Otimizada dos Produtos
            // Ordenação por ID garante consistência entre páginas
            const productsQuery = `
                SELECT id, name, price 
                FROM store_products 
                WHERE guild_id = $1 
                ORDER BY id ASC 
                LIMIT $2 OFFSET $3
            `;
            
            const products = (await db.query(productsQuery, [interaction.guild.id, ITEMS_PER_PAGE, offset])).rows;

            // 5. Geração da UI
            const uiComponents = generateManageStockSelectMenu(products, page, totalPages, false);

            // 6. Atualização da Mensagem
            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro no manipulador de paginação de estoque:", error);
            // Tenta recuperar mostrando a primeira página em caso de erro crítico
            await interaction.editReply({
                content: `> ⚠️ Ocorreu um erro ao mudar de página. Voltando ao início...`,
                components: [], 
            }).catch(() => {});
            
            // Opcional: Chamar o handler inicial para resetar
            const initialHandler = require('./store_manage_stock.js');
            if(initialHandler) await initialHandler.execute(interaction).catch(() => {});
        }
    }
};