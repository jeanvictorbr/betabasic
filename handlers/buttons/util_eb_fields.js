// File: handlers/buttons/util_eb_fields.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_', 
    execute: async (interaction) => {
        const id = interaction.customId;
        if (!['util_eb_field_add', 'util_eb_field_rem', 'util_eb_clear_all'].includes(id)) return;

        const oldEmbed = interaction.message.embeds[0]?.data || {};
        let newEmbed = { ...oldEmbed };

        // 1. Adicionar Campo (Modal - não muda o update aqui)
        if (id === 'util_eb_field_add') {
            const modal = new ModalBuilder().setCustomId('util_eb_sub_field').setTitle('Adicionar Campo');
            // ... (Seus inputs do modal) ...
            const nameInput = new TextInputBuilder().setCustomId('field_name').setLabel('Título').setStyle(TextInputStyle.Short).setRequired(true);
            const valInput = new TextInputBuilder().setCustomId('field_value').setLabel('Conteúdo').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const inlineInput = new TextInputBuilder().setCustomId('field_inline').setLabel('Inline?').setStyle(TextInputStyle.Short).setRequired(false);
            
            modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(valInput), new ActionRowBuilder().addComponents(inlineInput));
            return await interaction.showModal(modal);
        }

        // 2. Remover Campo
        if (id === 'util_eb_field_rem') {
            if (newEmbed.fields && newEmbed.fields.length > 0) newEmbed.fields.pop();
            const payload = embedBuilderPanel(newEmbed);
            // ✅ CORREÇÃO: Sem .body
            return await interaction.update(payload);
        }

        // 3. Limpar Tudo
        if (id === 'util_eb_clear_all') {
            newEmbed = { description: 'Conteúdo limpo.', color: 0x2B2D31 };
            const payload = embedBuilderPanel(newEmbed);
            // ✅ CORREÇÃO: Sem .body
            return await interaction.update(payload);
        }
    }
};