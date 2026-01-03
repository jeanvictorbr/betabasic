// File: handlers/buttons/util_cb_actions.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_cb_', // Catch-all para undo e clear
    execute: async (interaction) => {
        const action = interaction.customId;
        
        let currentState = interaction.client.containerState?.get(interaction.user.id);
        if (!currentState) currentState = { items: [] };

        if (action === 'util_cb_undo') {
            currentState.items.pop(); // Remove o último
        } else if (action === 'util_cb_clear') {
            currentState.items = []; // Limpa tudo
        } else {
            return; // Se não for undo/clear, ignora (ex: send)
        }

        interaction.client.containerState.set(interaction.user.id, currentState);
        await interaction.update(containerBuilderPanel(currentState).body);
    }
};