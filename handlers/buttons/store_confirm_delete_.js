// handlers/buttons/store_confirm_delete_.js
const { MessageFlags } = require('discord.js');
const db = require('../../database.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine');

module.exports = {
    // MUDANÇA AQUI: Agora escuta apenas "store_confirm_delprod_"
    customId: 'store_confirm_delprod_', 
    execute: async (interaction, client) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Extrai ID: store_confirm_delprod_123 -> índice 3
            const productId = interaction.customId.split('_')[3];

            // Verificação de segurança extra para garantir que é número
            if (!productId || isNaN(productId)) {
                return interaction.editReply({ content: '❌ Erro interno: ID do produto inválido.' });
            }

            // Verifica se existe
            const check = await db.query('SELECT name FROM store_products WHERE id = $1 AND guild_id = $2', [productId, interaction.guild.id]);
            
            if (check.rowCount === 0) {
                return interaction.editReply({ content: '❌ Este produto já foi removido.' });
            }

            const productName = check.rows[0].name;

            // Remove estoque e produto
            await db.query('DELETE FROM store_stock WHERE product_id = $1', [productId]);
            await db.query('DELETE FROM store_products WHERE id = $1 AND guild_id = $2', [productId, interaction.guild.id]);

            // Atualiza Vitrine
            try {
                if (updateStoreVitrine) {
                    await updateStoreVitrine(client, interaction.guild.id, db);
                }
            } catch (vitrineError) {
                console.error('Erro vitrine:', vitrineError);
            }

            await interaction.editReply({ 
                content: `✅ O produto **${productName}** foi removido com sucesso!` 
            });

            // Limpa mensagem
            try { if (interaction.message.deletable) await interaction.message.delete(); } catch (e) {}

        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao tentar excluir o produto.' });
        }
    }
};