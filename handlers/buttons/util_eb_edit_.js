// File: handlers/buttons/util_eb_edit_.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'util_eb_edit_', // Captura todos que começam com isso
    execute: async (interaction) => {
        const action = interaction.customId.replace('util_eb_edit_', '');
        
        let modal, input;

        // Seleciona qual modal abrir baseado na ação
        switch (action) {
            case 'title':
                modal = new ModalBuilder().setCustomId('util_eb_sub_title').setTitle('Editar Título');
                input = new TextInputBuilder().setCustomId('input_content').setLabel('Novo Título').setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(true);
                break;
            case 'description':
                modal = new ModalBuilder().setCustomId('util_eb_sub_desc').setTitle('Editar Descrição');
                input = new TextInputBuilder().setCustomId('input_content').setLabel('Nova Descrição').setStyle(TextInputStyle.Paragraph).setMaxLength(4000).setRequired(true);
                break;
            case 'color':
                modal = new ModalBuilder().setCustomId('util_eb_sub_color').setTitle('Alterar Cor');
                input = new TextInputBuilder().setCustomId('input_content').setLabel('Código Hex (ex: #FF0000)').setStyle(TextInputStyle.Short).setMaxLength(7).setRequired(true).setPlaceholder('#2ECC71');
                break;
            case 'image':
                modal = new ModalBuilder().setCustomId('util_eb_sub_image').setTitle('Definir Imagem Grande');
                input = new TextInputBuilder().setCustomId('input_content').setLabel('URL da Imagem').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('https://...');
                break;
            case 'thumbnail':
                modal = new ModalBuilder().setCustomId('util_eb_sub_thumb').setTitle('Definir Thumbnail (Pequena)');
                input = new TextInputBuilder().setCustomId('input_content').setLabel('URL da Thumbnail').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('https://...');
                break;
            case 'meta':
                // Modal duplo para Footer e Author
                modal = new ModalBuilder().setCustomId('util_eb_sub_meta').setTitle('Autor e Rodapé');
                const footerInput = new TextInputBuilder().setCustomId('input_footer').setLabel('Texto do Rodapé').setStyle(TextInputStyle.Short).setRequired(false);
                const authorInput = new TextInputBuilder().setCustomId('input_author').setLabel('Nome do Autor').setStyle(TextInputStyle.Short).setRequired(false);
                
                modal.addComponents(
                    new ActionRowBuilder().addComponents(footerInput),
                    new ActionRowBuilder().addComponents(authorInput)
                );
                return await interaction.showModal(modal);
        }

        if (modal && input) {
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
        }
    }
};