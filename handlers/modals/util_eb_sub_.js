// File: handlers/modals/util_eb_sub_.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_sub_', // Prefixo para capturar todos os sub-modais
    execute: async (interaction) => {
        // Recupera o embed atual da mensagem (o estado atual)
        const oldEmbed = interaction.message.embeds[0]?.data || {};
        
        // Identifica qual ação está sendo executada (title, desc, color, etc)
        const action = interaction.customId.replace('util_eb_sub_', '');
        
        // Clona o objeto para edição segura
        let newEmbed = { ...oldEmbed };

        // Processa a alteração baseada na ação
        if (action === 'title') {
            newEmbed.title = interaction.fields.getTextInputValue('input_content');
        } 
        else if (action === 'desc') {
            newEmbed.description = interaction.fields.getTextInputValue('input_content');
        }
        else if (action === 'color') {
            let colorHex = interaction.fields.getTextInputValue('input_content');
            // Garante que tenha #
            if (!colorHex.startsWith('#')) colorHex = '#' + colorHex;
            try {
                // Converte Hex para Inteiro (formato Discord)
                newEmbed.color = parseInt(colorHex.replace('#', ''), 16);
            } catch (e) { /* ignora erro de cor inválida */ }
        }
        else if (action === 'image') {
            const url = interaction.fields.getTextInputValue('input_content');
            if (url) newEmbed.image = { url: url };
            else delete newEmbed.image; // Remove se estiver vazio
        }
        else if (action === 'thumb') {
            const url = interaction.fields.getTextInputValue('input_content');
            if (url) newEmbed.thumbnail = { url: url };
            else delete newEmbed.thumbnail;
        }
        else if (action === 'meta') {
            const footerText = interaction.fields.getTextInputValue('input_footer');
            const authorText = interaction.fields.getTextInputValue('input_author');
            
            if (footerText) newEmbed.footer = { text: footerText };
            else delete newEmbed.footer;

            if (authorText) newEmbed.author = { name: authorText };
            else delete newEmbed.author;
        }

        // Gera a nova interface com o embed atualizado
        const payload = embedBuilderPanel(newEmbed);

        // ✅ CORREÇÃO CRÍTICA: Enviar apenas o .body para Componentes V2
        await interaction.update(payload.body);
    }
};