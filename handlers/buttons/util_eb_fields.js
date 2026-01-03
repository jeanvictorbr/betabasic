// File: handlers/buttons/util_eb_fields.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_', // Catch-all para field_add, field_rem, clear_all
    execute: async (interaction) => {
        // Verifica se é um destes comandos específicos
        const id = interaction.customId;
        if (!['util_eb_field_add', 'util_eb_field_rem', 'util_eb_clear_all'].includes(id)) return;

        const oldEmbed = interaction.message.embeds[0]?.data || {};
        let newEmbed = { ...oldEmbed };

        if (id === 'util_eb_field_add') {
            const modal = new ModalBuilder().setCustomId('util_eb_sub_field').setTitle('Adicionar Campo');
            const nameInput = new TextInputBuilder().setCustomId('field_name').setLabel('Título do Campo').setStyle(TextInputStyle.Short).setRequired(true);
            const valInput = new TextInputBuilder().setCustomId('field_value').setLabel('Conteúdo').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const inlineInput = new TextInputBuilder().setCustomId('field_inline').setLabel('Inline? (sim/nao)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('nao');

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(valInput),
                new ActionRowBuilder().addComponents(inlineInput)
            );
            return await interaction.showModal(modal);
        }

        if (id === 'util_eb_field_rem') {
            if (newEmbed.fields && newEmbed.fields.length > 0) {
                newEmbed.fields.pop(); // Remove o último
            }
            return await interaction.update(embedBuilderPanel(newEmbed));
        }

        if (id === 'util_eb_clear_all') {
            newEmbed = { description: 'Embed limpo.' };
            return await interaction.update(embedBuilderPanel(newEmbed));
        }
    }
};