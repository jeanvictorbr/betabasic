const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    customId: 'store_manage_stock_search',
    async execute(interaction) {
        // Abre um modal para digitar o nome
        const modal = new ModalBuilder()
            .setCustomId('modal_store_stock_search')
            .setTitle('🔍 Pesquisar Produto');

        const input = new TextInputBuilder()
            .setCustomId('search_query')
            .setLabel('Nome ou parte do nome do produto')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Vip, Carro, Ouro...')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        await interaction.showModal(modal);
    }
};