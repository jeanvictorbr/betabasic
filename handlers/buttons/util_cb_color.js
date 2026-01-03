// File: handlers/buttons/util_cb_color.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'util_cb_color',
    execute: async (interaction) => {
        const modal = new ModalBuilder().setCustomId('util_cb_modal_color').setTitle('Cor da Barra Lateral');
        const input = new TextInputBuilder()
            .setCustomId('hex_input')
            .setLabel('Cor Hex (ex: #FF0000)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(7)
            .setRequired(true)
            .setPlaceholder('#5865F2');

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }
};