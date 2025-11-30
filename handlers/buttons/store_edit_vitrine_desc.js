const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'store_edit_vitrine_desc',
    async execute(interaction) {
        const settings = (await db.query('SELECT * FROM guild_settings WHERE guild_id = $1', [interaction.guild.id])).rows[0];

        const modal = new ModalBuilder()
            .setCustomId('store_edit_vitrine_desc_modal')
            .setTitle('Editar Descrição da Vitrine');

        const descInput = new TextInputBuilder()
            .setCustomId('store_vitrine_desc_input')
            .setLabel("Nova Descrição")
            .setStyle(TextInputStyle.Paragraph) // Paragraph para descrições longas
            .setPlaceholder("Digite a descrição da sua loja aqui...")
            .setMaxLength(4000)
            .setRequired(true);

        // --- CORREÇÃO: Preencher com valor atual ---
        if (settings?.store_vitrine_desc) {
            // Garante que não ultrapasse o limite do input se por acaso o DB tiver algo enorme (segurança)
            descInput.setValue(settings.store_vitrine_desc.substring(0, 4000));
        }
        // -------------------------------------------

        const firstActionRow = new ActionRowBuilder().addComponents(descInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
};