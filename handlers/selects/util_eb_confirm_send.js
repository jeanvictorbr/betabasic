// File: handlers/selects/util_eb_confirm_send.js
const { EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'util_eb_confirm_send',
    execute: async (interaction) => {
        const channelId = interaction.values[0];
        const draftEmbed = interaction.client.embedDrafts?.get(interaction.user.id);

        if (!draftEmbed) {
            return interaction.reply({ 
                content: "❌ Sessão expirada ou embed não encontrado. Tente clicar em 'Enviar' novamente no painel.", 
                flags: EPHEMERAL_FLAG 
            });
        }

        try {
            const channel = await interaction.guild.channels.fetch(channelId);
            if (!channel) throw new Error("Canal não encontrado.");

            // Envia o embed
            await channel.send({ embeds: [draftEmbed] });

            // Limpa o rascunho
            interaction.client.embedDrafts.delete(interaction.user.id);

            await interaction.update({ 
                content: `✅ **Sucesso!** O container foi enviado para ${channel}.`, 
                components: [] 
            });

        } catch (error) {
            console.error(error);
            await interaction.update({ 
                content: `❌ Falha ao enviar: ${error.message}. Verifique minhas permissões no canal.`, 
                components: [] 
            });
        }
    }
};