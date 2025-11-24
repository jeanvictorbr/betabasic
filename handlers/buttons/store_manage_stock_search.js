const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'store_manage_stock_search',
    run: async (client, interaction) => {
        // Cria o modal V2 manualmente ou usando o Builder (aqui usando builder para facilitar o modal, mas output é JSON)
        const modal = new ModalBuilder()
            .setCustomId('modal_store_stock_search')
            .setTitle('Pesquisar Produto');

        const input = new TextInputBuilder()
            .setCustomId('search_query')
            .setLabel("Nome do produto (ou parte dele)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: Vip Gold")
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
};