// File: handlers/buttons/util_cb_style_.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');
const { extractContainerState } = require('../../utils/devPanelUtils.js'); // Função auxiliar (ver abaixo) ou inline

module.exports = {
    customId: 'util_cb_style_',
    execute: async (interaction) => {
        const style = parseInt(interaction.customId.replace('util_cb_style_', ''));
        
        // Lógica para recuperar o estado atual da mensagem V2
        // Na V2, o preview é o segundo componente (index 1)
        const previewComp = interaction.message.components[1]; 
        const titleComp = previewComp.components[0];
        const descComp = previewComp.components[1];
        const accessory = previewComp.accessory;

        const currentState = {
            accessoryLabel: accessory.label,
            accessoryStyle: style, // Atualiza o estilo
            title: titleComp.content.replace(/\*\*/g, ''), // Remove negrito fake
            description: descComp.content,
            emoji: accessory.emoji ? accessory.emoji.name : null
        };

        const payload = containerBuilderPanel(currentState);
        await interaction.update(payload.body);
    }
};