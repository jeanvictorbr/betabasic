// File: handlers/buttons/util_eb_start.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        try {
            const initialState = {
                accent_color: 0x5865F2, 
                items: [
                    { type: 'header', content: 'Novo Container' },
                    { type: 'text', content: 'Exemplo de texto. A barra ao lado indica a cor.' }
                ]
            };

            // Inicia o cache na memória
            if (!interaction.client.containerState) interaction.client.containerState = new Map();
            interaction.client.containerState.set(interaction.user.id, initialState);

            const payload = containerBuilderPanel(initialState);
            
            // Usa .reply para criar nova mensagem V2
            await interaction.reply({ ...payload.body, ephemeral: true });
            
        } catch (error) {
            console.error("Erro ao iniciar Container Builder:", error);
            if (!interaction.replied) await interaction.reply({ content: "Erro ao abrir.", ephemeral: true });
        }
    }
};