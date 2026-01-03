// File: handlers/buttons/util_cb_edit_.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'util_cb_edit_',
    execute: async (interaction) => {
        const action = interaction.customId.replace('util_cb_edit_', '');
        let modal;

        if (action === 'title') {
            modal = new ModalBuilder().setCustomId('util_cb_sub_title').setTitle('Editar Título');
            const input = new TextInputBuilder().setCustomId('input_val').setLabel('Título do Container').setStyle(TextInputStyle.Short).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        } 
        else if (action === 'desc') {
            modal = new ModalBuilder().setCustomId('util_cb_sub_desc').setTitle('Editar Descrição');
            const input = new TextInputBuilder().setCustomId('input_val').setLabel('Texto da Descrição').setStyle(TextInputStyle.Paragraph).setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }
        else if (action === 'btn') {
            modal = new ModalBuilder().setCustomId('util_cb_sub_btn').setTitle('Configurar Botão (Acessório)');
            const label = new TextInputBuilder().setCustomId('btn_label').setLabel('Nome do Botão').setStyle(TextInputStyle.Short).setRequired(true);
            const emoji = new TextInputBuilder().setCustomId('btn_emoji').setLabel('Emoji').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('🚀');
            modal.addComponents(new ActionRowBuilder().addComponents(label), new ActionRowBuilder().addComponents(emoji));
        }

        if (modal) await interaction.showModal(modal);
    }
};