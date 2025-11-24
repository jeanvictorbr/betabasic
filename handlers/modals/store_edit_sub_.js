// Substitua em: handlers/modals/store_edit_sub_.js
const db = require('../../database.js');
const generateEditProductSelectMenu = require('../../ui/store/editProductSelectMenu.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine.js'); // <--- IMPORTANTE
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_edit_sub_',
    async execute(interaction) {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const productId = interaction.customId.replace('store_edit_sub_', '');

        const name = interaction.fields.getTextInputValue('name');
        let price = interaction.fields.getTextInputValue('price').replace(',', '.');
        let stock = parseInt(interaction.fields.getTextInputValue('stock'));
        const description = interaction.fields.getTextInputValue('description');

        if (isNaN(price)) price = 0;
        if (isNaN(stock)) stock = -1;

        try {
            // 1. Atualizar Banco de Dados
            await db.query(
                'UPDATE store_products SET name=$1, price=$2, description=$3, stock=$4 WHERE id=$5 AND guild_id=$6',
                [name, price, description, stock, productId, interaction.guild.id]
            );

            // 2. ATUALIZAR A VITRINE EM TEMPO REAL
            try {
                await updateStoreVitrine(interaction.client, interaction.guild.id);
            } catch (err) {
                console.error("Erro ao atualizar vitrine automática:", err);
            }

            // 3. Atualizar o Menu do Admin (Voltar a lista)
            const ITEMS_PER_PAGE = 25;
            const countResult = await db.query('SELECT COUNT(*) as count FROM store_products WHERE guild_id = $1', [interaction.guild.id]);
            const totalItems = parseInt(countResult.rows[0].count || 0);
            let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (totalPages < 1) totalPages = 1;

            const products = (await db.query(
                'SELECT id, name, price FROM store_products WHERE guild_id = $1 ORDER BY id ASC LIMIT $2 OFFSET 0', 
                [interaction.guild.id, ITEMS_PER_PAGE]
            )).rows;

            const uiComponents = generateEditProductSelectMenu(products, 0, totalPages, false);

            // Feedback visual no menu
            if (uiComponents[0] && uiComponents[0].components && uiComponents[0].components[0]) {
                const oldContent = uiComponents[0].components[0].content;
                uiComponents[0].components[0].content = `> ✅ **Sucesso!** Produto **${name}** salvo e vitrine atualizada!\n` + oldContent;
            }

            await interaction.editReply({
                components: uiComponents,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao salvar edição:", error);
            await interaction.followUp({ content: '❌ Erro ao salvar.', ephemeral: true });
        }
    }
};