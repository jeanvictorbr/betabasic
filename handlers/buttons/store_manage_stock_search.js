const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    customId: 'store_manage_stock_search',
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('modal_store_stock_search')
            .setTitle('🔍 Pesquisar Produto');

        const input = new TextInputBuilder()
            .setCustomId('search_query')
            .setLabel('Nome do produto')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Digite o nome...')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    }
};