const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'profile_edit_bio_btn',
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('profile_bio_submit')
            .setTitle('Editar Sobre Mim');

        const bioInput = new TextInputBuilder()
            .setCustomId('bio_text')
            .setLabel('Sua Bio (Max 150 caracteres)')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(150)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(bioInput));

        await interaction.showModal(modal);
    }
};