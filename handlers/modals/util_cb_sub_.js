// File: handlers/modals/util_cb_sub_.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_cb_sub_',
    execute: async (interaction) => {
        const action = interaction.customId.replace('util_cb_sub_', '');
        
        // Recupera estado atual da mensagem
        const previewComp = interaction.message.components[1]; // O Container é o componente 1
        const titleComp = previewComp.components[0];
        const descComp = previewComp.components[1];
        const accessory = previewComp.accessory;

        let currentState = {
            accessoryLabel: accessory.label,
            accessoryStyle: accessory.style,
            title: titleComp.content.replace(/\*\*/g, ''),
            description: descComp.content,
            emoji: accessory.emoji ? accessory.emoji.name : null
        };

        // Atualiza
        if (action === 'title') {
            currentState.title = interaction.fields.getTextInputValue('input_val');
        } else if (action === 'desc') {
            currentState.description = interaction.fields.getTextInputValue('input_val');
        } else if (action === 'btn') {
            currentState.accessoryLabel = interaction.fields.getTextInputValue('btn_label');
            const emojiInput = interaction.fields.getTextInputValue('btn_emoji');
            currentState.emoji = emojiInput || null;
        }

        const payload = containerBuilderPanel(currentState);
        await interaction.update(payload.body);
    }
};