// handlers/buttons/suggestions_set_image.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = async (client, interaction, db) => {
    const modal = new ModalBuilder()
        .setCustomId('modal_suggestions_image')
        .setTitle('Alterar Imagem da Vitrine');

    const imageInput = new TextInputBuilder()
        .setCustomId('image_url')
        .setLabel("URL da Imagem/GIF")
        .setPlaceholder("https://i.imgur.com/...")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(imageInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
};