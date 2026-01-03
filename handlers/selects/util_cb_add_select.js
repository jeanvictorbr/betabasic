// File: handlers/selects/util_cb_add_select.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const containerBuilderPanel = require('../../ui/utilities/containerBuilderPanel.js');

module.exports = {
    customId: 'util_cb_add_select',
    execute: async (interaction) => {
        const selected = interaction.values[0];
        let currentState = interaction.client.containerState?.get(interaction.user.id);
        
        // Fallback de segurança se o estado for perdido
        if (!currentState) currentState = { accent_color: 0x5865F2, items: [] };

        // 1. Itens automáticos
        if (selected === 'add_divider') {
            currentState.items.push({ type: 'divider' });
            interaction.client.containerState.set(interaction.user.id, currentState);
            // ✅ Envia .body
            return await interaction.update(containerBuilderPanel(currentState).body);
        }
        if (selected === 'add_spacer') {
            currentState.items.push({ type: 'spacer' });
            interaction.client.containerState.set(interaction.user.id, currentState);
            // ✅ Envia .body
            return await interaction.update(containerBuilderPanel(currentState).body);
        }

        // 2. Itens com Modal
        let modalTitle = "Conteúdo";
        let label = "Texto";
        interaction.client.tempContainerAction = selected; 

        if (selected === 'add_header') { modalTitle = "Novo Título"; label = "Texto do Título:"; }
        if (selected === 'add_text') { modalTitle = "Novo Texto"; label = "Conteúdo:"; }
        if (selected === 'add_image') { modalTitle = "Imagem"; label = "URL da Imagem:"; }

        const modal = new ModalBuilder().setCustomId('util_cb_modal_add').setTitle(modalTitle);
        const input = new TextInputBuilder()
            .setCustomId('input_val')
            .setLabel(label)
            .setStyle(selected === 'add_text' ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }
};