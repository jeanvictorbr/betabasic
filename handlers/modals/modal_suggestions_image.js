module.exports = {
    customId: 'modal_suggestions_image',
    // CORREÇÃO AQUI: Ordem dos parâmetros ajustada
    execute: async (interaction, client, db) => {
        // Fallback de segurança para identificar a interação correta
        const i = interaction.fields ? interaction : client; 
        const database = db || (interaction.query ? interaction : client); // Tenta achar o DB

        const imageUrl = i.fields.getTextInputValue('image_url');

        // Validação básica de URL
        if (!imageUrl.match(/^https?:\/\/.*/)) {
            return i.reply({ content: '❌ Link inválido. Certifique-se de começar com http:// ou https://', ephemeral: true });
        }

        try {
            // Atualiza a tabela GUILDS
            // Se 'database' não tiver .query, verifique se o terceiro argumento 'db' está chegando corretamente
            await database.query(`
                UPDATE guilds 
                SET suggestions_vitrine_image = $1 
                WHERE guild_id = $2
            `, [imageUrl, i.guild.id]);

            await i.reply({ 
                content: '✅ Imagem da vitrine salva com sucesso!\n\nℹ️ **Nota:** Para ver a nova imagem, vá ao menu principal de sugestões e clique em **"Publicar Vitrine"** novamente.', 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro ao salvar imagem da vitrine:', error);
            if (!i.replied) {
                await i.reply({ content: '❌ Erro ao salvar a imagem no banco de dados.', ephemeral: true });
            }
        }
    }
};