// File: handlers/modals/util_cb_modal_add.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_cb_modal_add',
    execute: async (interaction) => {
        const content = interaction.fields.getTextInputValue('content_input');
        
        // Recupera o tipo selecionado anteriormente e o estado
        const typeToAdd = interaction.client.tempType;
        let currentState = interaction.client.containerState?.get(interaction.user.id);
        if (!currentState) currentState = { items: [] };

        // Processa a adição
        if (typeToAdd === 'add_header') {
            currentState.items.push({ type: 'header', content: content });
        } else if (typeToAdd === 'add_text_bar') {
            currentState.items.push({ type: 'text_bar', content: content });
        } else if (typeToAdd === 'add_text_raw') {
            currentState.items.push({ type: 'text_raw', content: content });
        } else if (typeToAdd === 'add_image') {
            currentState.items.push({ type: 'image', url: content });
        }

        // Salva e Atualiza
        interaction.client.containerState.set(interaction.user.id, currentState);
        await interaction.update(containerBuilderPanel(currentState).body);
    }
};