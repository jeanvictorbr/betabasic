const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    customId: 'dev_flow_add_item',
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('dev_flow_add_item_sub')
            .setTitle('Adicionar Item na Loja');

        const name = new TextInputBuilder().setCustomId('name').setLabel("Nome do Item (ex: Premium 7d)").setStyle(TextInputStyle.Short).setRequired(true);
        const feature = new TextInputBuilder().setCustomId('feature').setLabel("Feature Key (ex: AUTOMATIONS)").setStyle(TextInputStyle.Short).setRequired(true);
        const price = new TextInputBuilder().setCustomId('price').setLabel("Preço (FC)").setStyle(TextInputStyle.Short).setRequired(true);
        const days = new TextInputBuilder().setCustomId('days').setLabel("Duração (Dias)").setStyle(TextInputStyle.Short).setRequired(true);
        const emoji = new TextInputBuilder().setCustomId('emoji').setLabel("Emoji").setStyle(TextInputStyle.Short).setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(name),
            new ActionRowBuilder().addComponents(feature),
            new ActionRowBuilder().addComponents(price),
            new ActionRowBuilder().addComponents(days),
            new ActionRowBuilder().addComponents(emoji)
        );

        await interaction.showModal(modal);
    }
};