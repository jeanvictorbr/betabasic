// File: handlers/buttons/util_eb_start.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start', // Mantive o ID do botão do menu anterior
    execute: async (interaction) => {
        try {
            // Estado inicial limpo
            const initialState = {
                accessoryLabel: "Botão Ação",
                accessoryStyle: 1,
                title: "Novo Container V2",
                description: "Edite este texto usando os controles abaixo.",
                emoji: "⭐"
            };

            const payload = containerBuilderPanel(initialState);
            
            // Resposta V2 correta
            await interaction.update(payload.body);
            
        } catch (error) {
            console.error("Erro ao iniciar Container Builder:", error);
            if (!interaction.replied) await interaction.reply({ content: "Erro ao abrir.", ephemeral: true });
        }
    }
};