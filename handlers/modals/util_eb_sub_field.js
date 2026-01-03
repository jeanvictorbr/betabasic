// File: handlers/modals/util_eb_sub_field.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_sub_field',
    execute: async (interaction) => {
        const oldEmbed = interaction.message.embeds[0]?.data || {};
        let newEmbed = { ...oldEmbed };
        
        if (!newEmbed.fields) newEmbed.fields = [];

        const name = interaction.fields.getTextInputValue('field_name');
        const value = interaction.fields.getTextInputValue('field_value');
        const inlineRaw = interaction.fields.getTextInputValue('field_inline').toLowerCase();
        const inline = inlineRaw === 'sim' || inlineRaw === 'yes' || inlineRaw === 'true';

        // Discord limita a 25 fields
        if (newEmbed.fields.length < 25) {
            newEmbed.fields.push({ name, value, inline });
        }

        await interaction.update(embedBuilderPanel(newEmbed));
    }
};