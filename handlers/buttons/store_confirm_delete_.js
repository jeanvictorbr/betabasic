const { MessageFlags } = require('discord.js');
const db = require('../../database.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine'); // Importa a função de atualizar vitrine

module.exports = {
    // Captura qualquer ID que comece com store_confirm_delete_
    customId: 'store_confirm_delete_', 
    execute: async (interaction, client) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Extrai o ID do produto do customId (ex: store_confirm_delete_15 -> 15)
            const productId = interaction.customId.split('_')[3];

            if (!productId) {
                return interaction.editReply({ content: '❌ Erro: ID do produto inválido.' });
            }

            // 1. Verifica se o produto existe
            const check = await db.query('SELECT name FROM store_products WHERE id = $1 AND guild_id = $2', [productId, interaction.guild.id]);
            
            if (check.rowCount === 0) {
                return interaction.editReply({ content: '❌ Este produto já foi removido.' });
            }

            const productName = check.rows[0].name;

            // 2. Remove do Banco de Dados
            // Remove estoque primeiro (Foreign Key) se necessário, ou usa CASCADE no schema
            await db.query('DELETE FROM store_stock WHERE product_id = $1', [productId]);
            await db.query('DELETE FROM store_products WHERE id = $1 AND guild_id = $2', [productId, interaction.guild.id]);

            // 3. Atualiza a Vitrine (ESSENCIAL)
            try {
                if (updateStoreVitrine) {
                    await updateStoreVitrine(client, interaction.guild.id, db);
                }
            } catch (vitrineError) {
                console.error('Erro ao atualizar vitrine após remoção:', vitrineError);
                // Não interrompe o fluxo, apenas loga
            }

            // 4. Feedback
            await interaction.editReply({ 
                content: `✅ O produto **${productName}** foi removido com sucesso e a vitrine foi atualizada.` 
            });

            // Tenta deletar a mensagem de confirmação original para limpar o chat (opcional)
            try {
                if (interaction.message.deletable) await interaction.message.delete();
            } catch (e) {}

        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao tentar excluir o produto.' });
        }
    }
};