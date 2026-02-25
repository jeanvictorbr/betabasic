const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'f_selveh_', 
    async execute(interaction) {
        // Ex: f_selveh_venda_Carros -> remove prefixo -> venda_Carros
        const payload = interaction.customId.replace('f_selveh_', '').split('_');
        const type = payload[0];
        const category = payload[1];
        const vehicleIndex = interaction.values[0];

        // Monta CustomId do Modal (Ex: f_mod_venda_Carros_5)
        const modal = new ModalBuilder()
            .setCustomId(`f_mod_${type}_${category}_${vehicleIndex}`)
            .setTitle(`Finalizar ${type.toUpperCase()}`);

        const clientInput = new TextInputBuilder()
            .setCustomId('client_info')
            .setLabel("Nick ou ID do Cliente")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder("Ex: Joaozinho (#12345)");

        const firstActionRow = new ActionRowBuilder().addComponents(clientInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }
};