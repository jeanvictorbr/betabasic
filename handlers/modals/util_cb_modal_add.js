// File: handlers/modals/util_cb_modal_add.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_cb_modal_add',
    execute: async (interaction) => {
        const content = interaction.fields.getTextInputValue('input_val');
        const type = interaction.client.tempContainerAction;
        
        let currentState = interaction.client.containerState?.get(interaction.user.id);
        if (!currentState) currentState = { accent_color: 0x5865F2, items: [] };

        if (type === 'add_header') currentState.items.push({ type: 'header', content });
        else if (type === 'add_text') currentState.items.push({ type: 'text', content });
        else if (type === 'add_image') currentState.items.push({ type: 'image', url: content });

        interaction.client.containerState.set(interaction.user.id, currentState);
        await interaction.update(containerBuilderPanel(currentState).body);
    }
};