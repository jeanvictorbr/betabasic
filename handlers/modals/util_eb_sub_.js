// File: handlers/modals/util_eb_sub_.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_sub_', // Captura todos os submits de edição
    execute: async (interaction) => {
        // Recupera o embed atual da mensagem para não perder o que já foi feito
        const oldEmbed = interaction.message.embeds[0]?.data || {};
        const action = interaction.customId.replace('util_eb_sub_', '');
        
        let newEmbed = { ...oldEmbed };

        // Lógica de atualização baseada no input do modal
        const inputContent = interaction.fields.getTextInputValue('input_content');

        if (action === 'title') {
            newEmbed.title = inputContent;
        } 
        else if (action === 'desc') {
            newEmbed.description = inputContent;
        }
        else if (action === 'color') {
            let hex = inputContent.replace('#', '');
            try { newEmbed.color = parseInt(hex, 16); } catch (e) {}
        }
        else if (action === 'image') {
            if (inputContent) newEmbed.image = { url: inputContent };
            else delete newEmbed.image;
        }
        else if (action === 'thumb') {
            if (inputContent) newEmbed.thumbnail = { url: inputContent };
            else delete newEmbed.thumbnail;
        }
        else if (action === 'meta') {
            const footer = interaction.fields.getTextInputValue('input_footer');
            const author = interaction.fields.getTextInputValue('input_author');
            if (footer) newEmbed.footer = { text: footer };
            if (author) newEmbed.author = { name: author };
        }

        // Atualiza a mensagem com o novo embed
        // Passamos o objeto direto, SEM .body, pois é uma mensagem padrão
        await interaction.update(embedBuilderPanel(newEmbed));
    }
};