// handlers/modals/modal_suggestions_image.js
const updateSuggestionVitrine = require('../../utils/updateSuggestionVitrine'); 

module.exports = async (client, interaction, db) => {
    const imageUrl = interaction.fields.getTextInputValue('image_url');

    // Validação básica de URL
    if (!imageUrl.match(/^https?:\/\/.*/)) {
        return interaction.reply({ content: '❌ Link inválido. Certifique-se de começar com http:// ou https://', ephemeral: true });
    }

    try {
        // CORREÇÃO AQUI: Usando 'suggestions_vitrine_image' para bater com seu schema
        // Verifique se a tabela se chama 'suggestion_config' ou 'guilds' dependendo de onde essas colunas estão.
        // Se essas colunas estão na tabela 'guilds', use a query ABAIXO:
        
        await db.query(`
            UPDATE guilds 
            SET suggestions_vitrine_image = $1 
            WHERE guild_id = $2
        `, [imageUrl, interaction.guild.id]);

        /* OBS: Se você usa uma tabela separada chamada 'suggestion_config', use esta query em vez da de cima:
           await db.query(`INSERT INTO suggestion_config (guild_id, suggestions_vitrine_image) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET suggestions_vitrine_image = $2`, [interaction.guild.id, imageUrl]);
        */

        await interaction.reply({ content: '✅ Imagem da vitrine atualizada! Atualizando painel...', ephemeral: true });

        // Tenta atualizar visualmente
        try {
             if (updateSuggestionVitrine) await updateSuggestionVitrine(client, interaction.guild.id, db);
        } catch (e) {
            console.log("Erro ao atualizar visualmente:", e);
        }

    } catch (error) {
        console.error(error);
        interaction.reply({ content: '❌ Erro ao salvar a imagem no banco de dados.', ephemeral: true });
    }
};