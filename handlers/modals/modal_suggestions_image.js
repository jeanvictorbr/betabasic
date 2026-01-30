module.exports = {
    customId: 'modal_suggestions_image',
    execute: async (client, interaction, db) => {
        const imageUrl = interaction.fields.getTextInputValue('image_url');

        // Validação básica de URL
        if (!imageUrl.match(/^https?:\/\/.*/)) {
            return interaction.reply({ content: '❌ Link inválido. Certifique-se de começar com http:// ou https://', ephemeral: true });
        }

        try {
            // Atualiza a tabela GUILDS (padrão do seu schema)
            await db.query(`
                UPDATE guilds 
                SET suggestions_vitrine_image = $1 
                WHERE guild_id = $2
            `, [imageUrl, interaction.guild.id]);

            // Se você usar a tabela suggestion_config separada, descomente a linha abaixo e comente a de cima:
            // await db.query(`UPDATE suggestion_config SET suggestions_vitrine_image = $1 WHERE guild_id = $2`, [imageUrl, interaction.guild.id]);

            await interaction.reply({ 
                content: '✅ Imagem da vitrine salva com sucesso!\n\nℹ️ **Nota:** Para ver a nova imagem, vá ao menu principal de sugestões e clique em **"Publicar Vitrine"** novamente para atualizar a mensagem no canal.', 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro ao salvar imagem da vitrine:', error);
            interaction.reply({ content: '❌ Erro ao salvar a imagem no banco de dados.', ephemeral: true });
        }
    }
};