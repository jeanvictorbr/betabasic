const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    id: 'oauth_force_join_check',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const authSystemUrl = process.env.AUTH_SYSTEM_URL;

        if (!authSystemUrl) {
            return interaction.editReply("⚠️ Erro: A URL do sistema de Auth não está configurada no .env do bot.");
        }

        try {
            // Chama a API do sistema Auth que criamos (POST /api/join/:userId/:guildId)
            const response = await axios.post(`${authSystemUrl}/api/join/${userId}/${guildId}`);

            if (response.data.success) {
                const embed = new EmbedBuilder()
                    .setColor('#10B981') // Verde Sucesso
                    .setTitle('✅ Sucesso')
                    .setDescription('Sua conta foi verificada e sincronizada com o servidor com sucesso!');
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                throw new Error(response.data.msg || "Erro desconhecido");
            }

        } catch (error) {
            console.error(error);
            
            let errorMsg = "Não foi possível verificar sua conta.";
            if (error.response && error.response.status === 404) {
                errorMsg = "Você ainda não fez login pelo link. Por favor, clique no botão **Verificar Agora** primeiro.";
            }

            const embed = new EmbedBuilder()
                .setColor('#EF4444') // Vermelho Erro
                .setTitle('❌ Falha na Verificação')
                .setDescription(errorMsg);

            await interaction.editReply({ embeds: [embed] });
        }
    }
};