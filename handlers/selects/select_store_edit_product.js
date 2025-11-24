// Substitua em: handlers/selects/select_store_edit_product.js
const db = require('../../database.js');
const generateProductEditPanel = require('../../ui/store/productEditPanel.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'select_store_edit_product',
    async execute(interaction) {
        // Interações de select menu precisam de update ou deferUpdate
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const productId = interaction.values[0];

        // Se o usuário selecionou "no_result", ignoramos
        if (productId === 'no_result') return;

        try {
            // Buscar dados atualizados do produto
            const product = (await db.query('SELECT * FROM store_products WHERE id = $1', [productId])).rows[0];

            if (!product) {
                return interaction.followUp({ content: '❌ Produto não encontrado (pode ter sido excluído).', ephemeral: true });
            }

            // Gerar o Painel de Edição
            const uiComponents = generateProductEditPanel(product);

            // Atualizar a mensagem para mostrar o painel
            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao selecionar produto para editar:", error);
            await interaction.followUp({ content: '❌ Erro ao carregar produto.', ephemeral: true });
        }
    }
};