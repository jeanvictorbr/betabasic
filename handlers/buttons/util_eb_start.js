// File: handlers/buttons/util_eb_start.js
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        // Inicia com um estado padrão
        const initialEmbed = {
            title: "Título do Novo Container",
            description: "Clique nos botões abaixo para começar a editar este conteúdo.",
            color: 0x5865F2, // Blurple
            footer: { text: "Criado via BasicFlow Builder" }
        };
        
        await interaction.update(embedBuilderPanel(initialEmbed));
    }
};