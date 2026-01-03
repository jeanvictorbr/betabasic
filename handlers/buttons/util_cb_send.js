// File: handlers/buttons/util_cb_send.js
const { EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'util_cb_send',
    execute: async (interaction) => {
        // Extrai o estado final do container da mensagem
        const previewComp = interaction.message.components[1];
        
        // Salva na memoria temporária
        if (!interaction.client.containerDrafts) interaction.client.containerDrafts = new Map();
        interaction.client.containerDrafts.set(interaction.user.id, previewComp);

        const selectMenu = {
            type: 17,
            body: {
                type: 1,
                flags: EPHEMERAL_FLAG,
                components: [{
                    type: 1,
                    components: [{
                        type: 8, // Channel Select
                        custom_id: "util_cb_confirm_send",
                        channel_types: [0, 5],
                        placeholder: "Selecione o canal para enviar o Container..."
                    }]
                }]
            }
        };
        
        await interaction.reply(selectMenu.body);
    }
};