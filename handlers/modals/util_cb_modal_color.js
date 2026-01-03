// File: handlers/modals/util_cb_modal_color.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_cb_modal_color',
    execute: async (interaction) => {
        let hex = interaction.fields.getTextInputValue('hex_input');
        if (!hex.startsWith('#')) hex = '#' + hex;

        let currentState = interaction.client.containerState?.get(interaction.user.id);
        if (!currentState) currentState = { accent_color: 0x5865F2, items: [] };

        try {
            currentState.accent_color = parseInt(hex.replace('#', ''), 16);
        } catch (e) {
            // Se falhar, mantém a atual
        }

        interaction.client.containerState.set(interaction.user.id, currentState);
        await interaction.update(containerBuilderPanel(currentState).body);
    }
};