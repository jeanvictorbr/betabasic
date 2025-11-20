const axios = require('axios');

module.exports = {
    // Este handler captura qualquer botão que comece com "oauth_transfer_"
    check: (id) => id.startsWith('oauth_transfer_'),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const targetId = interaction.customId.split('_')[2]; // oauth_transfer_12345 -> 12345
        const guildId = interaction.guild.id;
        const authUrl = process.env.AUTH_SYSTEM_URL;

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