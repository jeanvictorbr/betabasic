// handlers/modals/modal_suggestions_image.js
const { MessageFlags } = require('discord.js');
const db = require('../../database.js'); // Importação direta do DB

module.exports = {
    customId: 'modal_suggestions_image',
    execute: async (interaction, client) => {
        
        const imageUrl = interaction.fields.getTextInputValue('image_url');

        // Validação básica de URL
        if (!imageUrl.match(/^https?:\/\/.*/)) {
            return interaction.reply({ 
                content: '❌ Link inválido. Certifique-se de começar com http:// ou https://', 
                flags: MessageFlags.Ephemeral 
            });
        }

        try {
            // CORREÇÃO CRÍTICA:
            // 1. Mudamos a tabela de 'guilds' para 'suggestion_config'
            // 2. Usamos INSERT ... ON CONFLICT ... UPDATE para garantir que funcione mesmo se a config não existir ainda
            
            await db.query(`
                INSERT INTO suggestion_config (guild_id, suggestions_vitrine_image)
                VALUES ($1, $2)
                ON CONFLICT (guild_id)
                DO UPDATE SET suggestions_vitrine_image = $2
            `, [interaction.guild.id, imageUrl]);

            await interaction.reply({ 
                content: '✅ Imagem da vitrine salva com sucesso!\n\nℹ️ **Nota:** Vá ao menu e clique em **"Publicar Vitrine"** novamente para ver a mudança.', 
                flags: MessageFlags.Ephemeral 
            });

        } catch (error) {
            console.error('Erro ao salvar imagem da vitrine:', error);
            
            // Verifica se o erro é falta da coluna
            if (error.message.includes('column "suggestions_vitrine_image" of relation "suggestion_config" does not exist')) {
                return interaction.reply({ content: '❌ **Erro de Banco de Dados:** A coluna da imagem ainda não existe. Por favor, peça ao desenvolvedor para rodar o comando SQL de atualização.', flags: MessageFlags.Ephemeral });
            }

            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ Erro ao salvar no banco de dados. Verifique os logs.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};