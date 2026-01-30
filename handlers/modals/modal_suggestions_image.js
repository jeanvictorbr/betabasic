// handlers/modals/modal_suggestions_image.js
const { MessageFlags } = require('discord.js');
const db = require('../../database.js'); // Importação direta para garantir a conexão

module.exports = {
    customId: 'modal_suggestions_image',
    // O index.js envia (interaction, client)
    execute: async (interaction, client) => {
        
        const imageUrl = interaction.fields.getTextInputValue('image_url');

        // Validação básica de URL
        if (!imageUrl.match(/^https?:\/\/.*/)) {
            return interaction.reply({ 
                content: '❌ Link inválido. Certifique-se de começar com http:// ou https://', 
                flags: MessageFlags.Ephemeral // Correção do warning
            });
        }

        try {
            // Atualiza a tabela GUILDS usando a conexão importada
            await db.query(`
                UPDATE guilds 
                SET suggestions_vitrine_image = $1 
                WHERE guild_id = $2
            `, [imageUrl, interaction.guild.id]);

            await interaction.reply({ 
                content: '✅ Imagem da vitrine salva com sucesso!\n\nℹ️ **Nota:** Para ver a nova imagem, vá ao menu principal de sugestões e clique em **"Publicar Vitrine"** novamente.', 
                flags: MessageFlags.Ephemeral 
            });

        } catch (error) {
            console.error('Erro ao salvar imagem da vitrine:', error);
            // Evita erro se a interação já foi respondida
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Erro ao salvar a imagem no banco de dados.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};