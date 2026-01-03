// File: handlers/buttons/util_eb_fields.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const embedBuilderPanel = require('../../ui/utilities/embedBuilderPanel.js');

module.exports = {
    customId: 'util_eb_', // Catch-all para field_add, field_rem, clear_all
    execute: async (interaction) => {
        const id = interaction.customId;
        
        // Verificação de segurança para garantir que é um botão de field
        if (!['util_eb_field_add', 'util_eb_field_rem', 'util_eb_clear_all'].includes(id)) return;

        // Recupera estado atual
        const oldEmbed = interaction.message.embeds[0]?.data || {};
        let newEmbed = { ...oldEmbed };

        // 1. Botão Adicionar Campo: Abre Modal (não usa update aqui)
        if (id === 'util_eb_field_add') {
            const modal = new ModalBuilder()
                .setCustomId('util_eb_sub_field') // Handler específico para fields
                .setTitle('Adicionar Campo');

            const nameInput = new TextInputBuilder()
                .setCustomId('field_name')
                .setLabel('Título do Campo')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(256)
                .setRequired(true);

            const valInput = new TextInputBuilder()
                .setCustomId('field_value')
                .setLabel('Conteúdo')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(1024)
                .setRequired(true);

            const inlineInput = new TextInputBuilder()
                .setCustomId('field_inline')
                .setLabel('Inline? (sim/nao)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setPlaceholder('nao');

            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(valInput),
                new ActionRowBuilder().addComponents(inlineInput)
            );
            
            return await interaction.showModal(modal);
        }

        // 2. Botão Remover Último Campo
        if (id === 'util_eb_field_rem') {
            if (newEmbed.fields && newEmbed.fields.length > 0) {
                newEmbed.fields.pop(); // Remove o último item do array
            }
            
            const payload = embedBuilderPanel(newEmbed);
            // ✅ CORREÇÃO CRÍTICA: payload.body
            return await interaction.update(payload.body);
        }

        // 3. Botão Limpar Tudo
        if (id === 'util_eb_clear_all') {
            // Reseta para um estado básico
            newEmbed = { 
                description: 'Conteúdo limpo.', 
                color: 0x2B2D31 
            };
            
            const payload = embedBuilderPanel(newEmbed);
            // ✅ CORREÇÃO CRÍTICA: payload.body
            return await interaction.update(payload.body);
        }
    }
};