// File: handlers/selects/util_cb_add_select.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_cb_add_select',
    execute: async (interaction) => {
        const selected = interaction.values[0];
        
        // Recupera estado da memória
        let currentState = interaction.client.containerState?.get(interaction.user.id);
        if (!currentState) currentState = { items: [] };

        // 1. Ações imediatas (não precisam de digitar)
        if (selected === 'add_divider') {
            currentState.items.push({ type: 'divider' });
            interaction.client.containerState.set(interaction.user.id, currentState);
            return await interaction.update(containerBuilderPanel(currentState).body);
        }
        if (selected === 'add_spacer') {
            currentState.items.push({ type: 'spacer' });
            interaction.client.containerState.set(interaction.user.id, currentState);
            return await interaction.update(containerBuilderPanel(currentState).body);
        }

        // 2. Ações que exigem Modal (Texto, Título, Imagem)
        let modalTitle = "Adicionar Conteúdo";
        let inputLabel = "Texto";
        let modalId = "util_cb_modal_add"; // Handler genérico para o modal

        // Salva o TIPO que estamos adicionando temporariamente no client para o modal saber
        interaction.client.tempType = selected; 

        if (selected === 'add_header') { modalTitle = "Novo Título (##)"; inputLabel = "Digite o título"; }
        if (selected === 'add_text_bar') { modalTitle = "Texto com Barra (>)"; inputLabel = "Digite o conteúdo"; }
        if (selected === 'add_image') { modalTitle = "Adicionar Imagem"; inputLabel = "Cole a URL da imagem (https://...)"; }

        const modal = new ModalBuilder().setCustomId(modalId).setTitle(modalTitle);
        const input = new TextInputBuilder()
            .setCustomId('content_input')
            .setLabel(inputLabel)
            .setStyle(selected === 'add_image' ? TextInputStyle.Short : TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }
};