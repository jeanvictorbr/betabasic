const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'store_edit_vitrine_image',
    async execute(interaction) {
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0];

        const modal = new ModalBuilder()
            .setCustomId('store_edit_vitrine_image_modal')
            .setTitle('Editar Imagem da Vitrine');

        const imageInput = new TextInputBuilder()
            .setCustomId('store_vitrine_image_input')
            .setLabel("URL da Imagem (Thumbnail)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("https://imgur.com/...")
            .setRequired(false); // Pode ser opcional para remover a imagem

        // --- CORREÇÃO: Preencher com valor atual ---
        if (settings?.store_vitrine_image) {
            imageInput.setValue(settings.store_vitrine_image);
        }
        // -------------------------------------------

        const firstActionRow = new ActionRowBuilder().addComponents(imageInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
};