// Crie em: handlers/modals/store_edit_sub_.js
const db = require('../../database.js');
const generateEditProductSelectMenu = require('../../ui/store/editProductSelectMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    // Captura IDs como 'store_edit_sub_123'
    customId: 'store_edit_sub_',
    async execute(interaction) {
        // Como é um modal, precisamos deferir a atualização da mensagem original
        await interaction.deferUpdate();

        // Extrair ID do produto
        const productId = interaction.customId.replace('store_edit_sub_', '');

        // Pegar valores digitados
        const name = interaction.fields.getTextInputValue('name');
        let price = interaction.fields.getTextInputValue('price').replace(',', '.');
        let stock = parseInt(interaction.fields.getTextInputValue('stock'));
        const description = interaction.fields.getTextInputValue('description');

        // Validações simples
        if (isNaN(price)) price = 0;
        if (isNaN(stock)) stock = -1;

        try {
            // 1. Atualizar no Banco de Dados
            await db.query(
                'UPDATE store_products SET name=$1, price=$2, description=$3, stock=$4 WHERE id=$5 AND guild_id=$6',
                [name, price, description, stock, productId, interaction.guild.id]
            );

            // 2. "Destravar" o Menu: Recarregar a lista de produtos atualizada
            // Vamos recarregar a página 0 ou manter lógica de página se preferir, 
            // mas para simplificar e garantir feedback, voltamos a pag 0.
            const ITEMS_PER_PAGE = 25;
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0', 
                [interaction.guild.id, ITEMS_PER_PAGE]
            )).rows;

            // 3. Gerar a UI atualizada
            const uiComponents = generateEditProductSelectMenu(products, 0, totalPages, false);

            // Adiciona uma mensagem de sucesso no topo temporariamente ou apenas atualiza
            // Vamos apenas atualizar o menu para ele ficar "limpo"
            await interaction.editReply({
                content: `> ✅ **Produto Atualizado!** (${name})\n> O menu abaixo foi recarregado.`,
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao salvar edição:", error);
            await interaction.followUp({ content: '❌ Erro ao salvar alterações.', ephemeral: true });
        }
    }
};