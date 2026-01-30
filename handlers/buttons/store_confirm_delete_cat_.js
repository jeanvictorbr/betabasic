const { MessageFlags } = require('discord.js');
const db = require('../../database.js');
const updateStoreVitrine = require('../../utils/updateStoreVitrine'); 

module.exports = {
    customId: 'store_confirm_delete_cat_',
    execute: async (interaction, client) => {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Extrai o ID: store_confirm_delete_cat_123 -> índice 4
            const categoryId = interaction.customId.split('_')[4];

            if (!categoryId) {
                return interaction.editReply({ content: '❌ ID da categoria inválido.' });
            }

            // 1. Busca a categoria para pegar os IDs das mensagens (vitrine) antes de deletar
            const catResult = await db.query('SELECT * FROM store_categories WHERE id = $1 AND guild_id = $2', [categoryId, interaction.guild.id]);
            
            if (catResult.rowCount === 0) {
                return interaction.editReply({ content: '❌ Categoria já foi excluída.' });
            }

            const category = catResult.rows[0];

            // 2. Apaga a mensagem da Vitrine da Categoria no Discord (se existir)
            if (category.vitrine_channel_id && category.vitrine_message_id) {
                try {
                    const channel = await interaction.guild.channels.fetch(category.vitrine_channel_id).catch(() => null);
                    if (channel) {
                        const message = await channel.messages.fetch(category.vitrine_message_id).catch(() => null);
                        if (message) {
                            await message.delete();
                            // Opcional: Avisar no log que a vitrine foi apagada
                        }
                    }
                } catch (msgError) {
                    console.log('Não foi possível apagar a mensagem da vitrine antiga (provavelmente já sumiu):', msgError.message);
                }
            }

            // 3. Desvincula produtos desta categoria (Define category_id como NULL)
            // Isso evita erro de Foreign Key ou perda de produtos
            await db.query('UPDATE store_products SET category_id = NULL WHERE category_id = $1', [categoryId]);

            // 4. Deleta a categoria do banco
            await db.query('DELETE FROM store_categories WHERE id = $1', [categoryId]);

            // 5. Atualiza a Vitrine Principal (para remover o botão da categoria excluída)
            try {
                if (updateStoreVitrine) {
                    await updateStoreVitrine(client, interaction.guild.id, db);
                }
            } catch (vitrineError) {
                console.error('Erro ao atualizar vitrine principal:', vitrineError);
            }

            await interaction.editReply({ 
                content: `✅ A categoria **${category.name}** foi excluída e sua vitrine removida com sucesso!` 
            });

        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao tentar excluir a categoria.' });
        }
    }
};