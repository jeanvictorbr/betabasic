const axios = require('axios');

module.exports = {
    // O index.js usa startsWith, então definimos o prefixo aqui
    customId: 'oauth_transfer_',
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        // Formato: oauth_transfer_USERID
        const parts = interaction.customId.split('_');
        const targetId = parts[2]; 
        const guildId = interaction.guild.id;
        const authUrl = process.env.AUTH_SYSTEM_URL;

        if (!targetId) return interaction.editReply("Erro: ID do usuário não identificado.");

        try {
            // Chama a API de Join
            const response = await axios.post(`${authUrl}/api/join/${targetId}/${guildId}`);
            
            if (response.data.success) {
                await interaction.editReply({ 
                    content: `✅ **Sucesso!** O comando de entrada foi enviado para o usuário <@${targetId}>.` 
                });
            } else {
                await interaction.editReply({ 
                    content: `⚠️ **Atenção:** O sistema tentou, mas o usuário não entrou. Ele pode já estar no servidor, ter banimento ou excedido o limite de servidores.` 
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: `❌ Erro ao processar: ${error.response?.data?.msg || error.message}` });
        }
    }
};