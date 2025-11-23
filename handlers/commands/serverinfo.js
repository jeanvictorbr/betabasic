const generateServerInfoEmbed = require('../../ui/serverInfoEmbed.js');

module.exports = async function(interaction) {
    await interaction.deferReply(); // Público, todos veem

    try {
        // Garante que o cache de canais e membros esteja atualizado para contagem correta
        await interaction.guild.channels.fetch();
        
        // Gera a UI
        const payload = await generateServerInfoEmbed(interaction.guild);
        
        await interaction.editReply(payload);
    } catch (error) {
        console.error('[ServerInfo] Erro:', error);
        await interaction.editReply({ content: '❌ Ocorreu um erro ao buscar as informações do servidor.' });
    }
};