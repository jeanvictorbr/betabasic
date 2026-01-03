// File: handlers/buttons/util_cb_send.js
const { EPHEMERAL_FLAG, V2_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'util_cb_send',
    execute: async (interaction) => {
        // Pede o canal via Select Menu V2
        const selectMenu = {
            type: 17,
            body: {
                type: 1,
                flags: EPHEMERAL_FLAG,
                components: [{
                    type: 1,
                    components: [{
                        type: 8, // Channel Select
                        custom_id: "util_cb_confirm_send_v2",
                        channel_types: [0, 5],
                        placeholder: "Selecione onde enviar o Container..."
                    }]
                }]
            }
        };
        await interaction.reply(selectMenu.body);
    }
};