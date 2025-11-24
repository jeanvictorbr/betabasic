// File: handlers/buttons/store_open_stock_panel_.js
const db = require('../../database.js');
// Importe AQUI o seu UI de estoque antigo. 
// Baseado nos arquivos que você enviou, parece ser ui/store/stockMenu.js
const stockMenu = require('../../ui/store/stockMenu.js'); 

const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_open_stock_panel_',
    async execute(interaction) {
        await interaction.deferUpdate();

        // Pega o ID do produto: store_open_stock_panel_123
        const productId = interaction.customId.split('_')[4];

        // Busca o produto específico
        const productRes = await db.query('SELECT * FROM store_products WHERE id = $1', [productId]);
        
        if (productRes.rowCount === 0) {
            return interaction.followUp({ content: '❌ Produto não encontrado.', ephemeral: true });
        }

        const product = productRes.rows[0];

        // Aqui chamamos o SEU menu de estoque existente.
        // Se o seu stockMenu espera uma LISTA de produtos (como era o select menu), vamos adaptar passando apenas este produto num array, ou chamar a função correta se for diferente.
        // Assumindo que você quer o painel de controle individual:
        
        /* ATENÇÃO: Se o seu stockMenu.js original gerava um dropdown, ele não serve para controle individual.
           Vou gerar aqui um PAINEL DE CONTROLE INDIVIDUAL que usa os botões de adicionar/remover que você mencionou já ter.
        */

        const embed = {
            title: `🏭 Gerenciar Estoque: ${product.name}`,
            description: `Use os botões abaixo para modificar o estoque.\n\n📊 **Atual:** ${product.stock}`,
            color: 0x5865F2
        };

        const components = [
            {
                type: 1,
                components: [
                    {
                        type: 2, style: 3, label: 'Adicionar (+)', 
                        custom_id: `store_add_stock_${product.id}`, // Usa seu handler existente de add
                        emoji: { name: '➕' }
                    },
                    {
                        type: 2, style: 4, label: 'Remover (-)', 
                        custom_id: `store_remove_stock_${product.id}`, // Cria um handler similar ao add se não tiver
                        emoji: { name: '➖' }
                    },
                    {
                        type: 2, style: 1, label: 'Definir Valor Fixo', 
                        custom_id: `store_edit_stock_${product.id}`, // Usa seu handler existente de edit
                        emoji: { name: '✏️' }
                    },
                    {
                        type: 2, style: 2, label: 'Voltar', 
                        custom_id: 'store_manage_products', 
                        emoji: { name: '↩️' }
                    }
                ]
            }
        ];

        await interaction.editReply({
            embeds: [embed],
            components: components,
            flags: V2_FLAG | EPHEMERAL_FLAG
        });
    }
};