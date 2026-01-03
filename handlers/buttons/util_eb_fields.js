// File: handlers/buttons/util_eb_fields.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_', // Prefixo para rotear field_add, field_rem, clear_all
    execute: async (interaction) => {
        const id = interaction.customId;
        // Evita conflitos com outros botões que comecem com util_eb_
        if (!['util_eb_field_add', 'util_eb_field_rem', 'util_eb_clear_all'].includes(id)) return;

        const oldEmbed = interaction.message.embeds[0]?.data || {};
        let newEmbed = { ...oldEmbed };

        // 1. Adicionar Campo: Abre Modal (não atualiza mensagem ainda)
        if (id === 'util_eb_field_add') {
            const modal = new ModalBuilder().setCustomId('util_eb_sub_field').setTitle('Adicionar Campo');
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('field_name').setLabel('Título').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('field_value').setLabel('Valor').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('field_inline').setLabel('Inline? (sim/nao)').setStyle(TextInputStyle.Short).setRequired(false))
            );
            
            return await interaction.showModal(modal);
        }

        // 2. Remover Último Campo
        if (id === 'util_eb_field_rem') {
            if (newEmbed.fields && newEmbed.fields.length > 0) {
                newEmbed.fields.pop();
            }
            return await interaction.update(embedBuilderPanel(newEmbed));
        }

        // 3. Limpar Tudo
        if (id === 'util_eb_clear_all') {
            newEmbed = { description: 'Conteúdo limpo.', color: 0x2B2D31 };
            return await interaction.update(embedBuilderPanel(newEmbed));
        }
    }
};