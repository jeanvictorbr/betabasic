// File: handlers/buttons/util_eb_start.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        try {
            // Estado inicial limpo V2
            const initialState = {
                items: [
                    { type: 'header', content: 'Novo Container V2' },
                    { type: 'text_bar', content: 'Edite este conteúdo usando o menu de seleção abaixo.\nUse a opção "Texto com Barra" para este visual.' }
                ]
            };

            // Salva estado inicial na memória para persistência rápida
            if (!interaction.client.containerState) interaction.client.containerState = new Map();
            interaction.client.containerState.set(interaction.user.id, initialState);

            const payload = containerBuilderPanel(initialState);
            await interaction.update(payload.body);
            
        } catch (error) {
            console.error("Erro ao iniciar Container Builder:", error);
            if (!interaction.replied) await interaction.reply({ content: "Erro ao abrir.", ephemeral: true });
        }
    }
};