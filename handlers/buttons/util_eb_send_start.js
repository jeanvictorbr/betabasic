// File: handlers/buttons/util_eb_send_start.js (ATUALIZADO)
const { EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'util_eb_send_start',
    execute: async (interaction) => {
        const currentEmbed = interaction.message.embeds[0]?.data;
        if (!currentEmbed) return;

        // Salva temporariamente no client (memória volátil rápida)
        if (!interaction.client.embedDrafts) interaction.client.embedDrafts = new Map();
        interaction.client.embedDrafts.set(interaction.user.id, currentEmbed);

        const response = {
            content: "📤 **Envio de Container**\nO seu embed está salvo na memória. Selecione o canal abaixo para enviá-lo imediatamente.",
            components: [
                {
                    type: 1,
                    components: [{
                        type: 8, // Channel Select
                        custom_id: "util_eb_confirm_send",
                        channel_types: [0, 5], 
                        placeholder: "Selecione o canal de destino..."
                    }]
                }
            ],
            flags: EPHEMERAL_FLAG
        };

        await interaction.reply(response);
    }
};