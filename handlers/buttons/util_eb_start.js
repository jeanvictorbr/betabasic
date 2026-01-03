// File: handlers/buttons/util_eb_start.js
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_eb_start',
    execute: async (interaction) => {
        try {
            // Estado Inicial
            const initialState = {
                accent_color: 0x5865F2, // Começa com Blurple
                items: [
                    { type: 'header', content: 'Título do Container' },
                    { type: 'text', content: 'Exemplo de texto. Use os menus abaixo para adicionar mais conteúdo.' }
                ]
            };

            // Salva na memória
            if (!interaction.client.containerState) interaction.client.containerState = new Map();
            interaction.client.containerState.set(interaction.user.id, initialState);

            const payload = containerBuilderPanel(initialState);
            
            // ATENÇÃO: .reply() aqui para criar uma nova mensagem limpa V2
            await interaction.reply({ ...payload.body, ephemeral: true });
            
        } catch (error) {
            console.error("Erro ao iniciar Container Builder:", error);
            if (!interaction.replied) await interaction.reply({ content: "Erro ao abrir.", ephemeral: true });
        }
    }
};