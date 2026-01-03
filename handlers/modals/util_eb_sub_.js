// File: handlers/modals/util_eb_sub_.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');
const { resolveColor } = require('discord.js'); // Ajuda com cores

module.exports = {
    customId: 'util_eb_sub_',
    execute: async (interaction) => {
        // Recupera o embed atual da mensagem
        const oldEmbed = interaction.message.embeds[0]?.data || {};
        const action = interaction.customId.replace('util_eb_sub_', '');
        
        // Clona para editar
        let newEmbed = { ...oldEmbed };

        // Processa baseado na ação
        if (action === 'title') {
            newEmbed.title = interaction.fields.getTextInputValue('input_content');
        } 
        else if (action === 'desc') {
            newEmbed.description = interaction.fields.getTextInputValue('input_content');
        }
        else if (action === 'color') {
            let colorHex = interaction.fields.getTextInputValue('input_content');
            if (!colorHex.startsWith('#')) colorHex = '#' + colorHex;
            try {
                newEmbed.color = parseInt(colorHex.replace('#', ''), 16);
            } catch (e) { /* ignora erro de cor */ }
        }
        else if (action === 'image') {
            newEmbed.image = { url: interaction.fields.getTextInputValue('input_content') };
        }
        else if (action === 'thumb') {
            newEmbed.thumbnail = { url: interaction.fields.getTextInputValue('input_content') };
        }
        else if (action === 'meta') {
            const footerText = interaction.fields.getTextInputValue('input_footer');
            const authorText = interaction.fields.getTextInputValue('input_author');
            
            if (footerText) newEmbed.footer = { text: footerText };
            if (authorText) newEmbed.author = { name: authorText };
        }

        // Atualiza a UI com o novo embed
        await interaction.update(embedBuilderPanel(newEmbed));
    }
};