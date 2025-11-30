const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'store_edit_vitrine_title',
    async execute(interaction) {
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0];

        const modal = new ModalBuilder()
            .setCustomId('store_edit_vitrine_title_modal') // ID do modal de submit
            .setTitle('Editar Título da Vitrine');

        const titleInput = new TextInputBuilder()
            .setCustomId('store_vitrine_title_input')
            .setLabel("Novo Título")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: Loja do Servidor")
            .setMaxLength(256)
            .setRequired(true);

        // --- CORREÇÃO: Preencher com valor atual ---
        if (settings?.store_vitrine_title) {
            titleInput.setValue(settings.store_vitrine_title);
        }
        // -------------------------------------------

        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
};