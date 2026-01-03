// File: handlers/modals/util_eb_sub_.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_sub_',
    execute: async (interaction) => {
        const oldEmbed = interaction.message.embeds[0]?.data || {};
        const action = interaction.customId.replace('util_eb_sub_', '');
        
        let newEmbed = { ...oldEmbed };

        // ... Lógica de processamento (MANTENHA A MESMA LÓGICA DE ANTES AQUI) ...
        if (action === 'title') newEmbed.title = interaction.fields.getTextInputValue('input_content');
        else if (action === 'desc') newEmbed.description = interaction.fields.getTextInputValue('input_content');
        else if (action === 'color') {
            let colorHex = interaction.fields.getTextInputValue('input_content');
            if (!colorHex.startsWith('#')) colorHex = '#' + colorHex;
            try { newEmbed.color = parseInt(colorHex.replace('#', ''), 16); } catch (e) {}
        }
        else if (action === 'image') {
            const url = interaction.fields.getTextInputValue('input_content');
            if (url) newEmbed.image = { url: url }; else delete newEmbed.image;
        }
        else if (action === 'thumb') {
            const url = interaction.fields.getTextInputValue('input_content');
            if (url) newEmbed.thumbnail = { url: url }; else delete newEmbed.thumbnail;
        }
        else if (action === 'meta') {
            const footerText = interaction.fields.getTextInputValue('input_footer');
            const authorText = interaction.fields.getTextInputValue('input_author');
            if (footerText) newEmbed.footer = { text: footerText }; else delete newEmbed.footer;
            if (authorText) newEmbed.author = { name: authorText }; else delete newEmbed.author;
        }

        const payload = embedBuilderPanel(newEmbed);
        // ✅ CORREÇÃO: Sem .body
        await interaction.update(payload);
    }
};