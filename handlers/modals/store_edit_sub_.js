// Substitua em: handlers/modals/store_edit_sub_.js
const db = require('../../database.js');
const generateEditProductSelectMenu = require('../../ui/store/editProductSelectMenu.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_edit_sub_',
    async execute(interaction) {
        // Deferir a resposta para processar o banco de dados
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        // Extrair ID e limpar
        const productId = interaction.customId.replace('store_edit_sub_', '');

        // Pegar valores do modal
        const name = interaction.fields.getTextInputValue('name');
        let price = interaction.fields.getTextInputValue('price').replace(',', '.');
        let stock = parseInt(interaction.fields.getTextInputValue('stock'));
        const description = interaction.fields.getTextInputValue('description');

        // Validação simples
        if (isNaN(price)) price = 0;
        if (isNaN(stock)) stock = -1;

        try {
            // 1. Atualizar no Banco
            await db.query(
                'UPDATE store_products SET name=$1, price=$2, description=$3, stock=$4 WHERE id=$5 AND guild_id=$6',
                [name, price, description, stock, productId, interaction.guild.id]
            );

            // 2. Recarregar o Menu (Voltar para página 0 para ver as mudanças)
            const ITEMS_PER_PAGE = 25;
            
            // Contagem para refazer paginação correta
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (totalPages < 1) totalPages = 1;

            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0', 
                [interaction.guild.id, ITEMS_PER_PAGE]
            )).rows;

            // 3. Gerar a UI Base
            const uiComponents = generateEditProductSelectMenu(products, 0, totalPages, false);

            // --- A CORREÇÃO ESTÁ AQUI ---
            // Em V2, não podemos usar 'content'. Temos que modificar o texto DENTRO do componente.
            // uiComponents[0] é o Container (Type 17)
            // uiComponents[0].components[0] é o Bloco de Texto (Type 10)
            if (uiComponents[0] && uiComponents[0].components && uiComponents[0].components[0]) {
                // Adicionamos a mensagem de sucesso no topo do texto existente
                const oldContent = uiComponents[0].components[0].content;
                uiComponents[0].components[0].content = `> ✅ **Sucesso!** Produto atualizado: **${name}**\n` + oldContent;
            }

            // 4. Enviar atualização (SEM o campo content solto)
            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao salvar edição:", error);
            // Tenta avisar do erro de forma segura
            await interaction.followUp({ content: '❌ Erro ao salvar no banco de dados.', ephemeral: true });
        }
    }
};