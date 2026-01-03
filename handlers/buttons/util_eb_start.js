// File: handlers/buttons/util_eb_start.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        try {
            // Estado inicial limpo
            const initialState = {
                accessoryLabel: "Ação",
                accessoryStyle: 1,
                title: "Novo Container V2",
                description: "Edite este texto usando os controles abaixo.",
                emoji: "⭐"
            };

            const payload = containerBuilderPanel(initialState);
            
            // Enviando .body (Correto para V2)
            await interaction.update(payload.body);
            
        } catch (error) {
            console.error("Erro ao iniciar Container Builder:", error);
            if (!interaction.replied) await interaction.reply({ content: "Erro ao abrir.", ephemeral: true });
        }
    }
};