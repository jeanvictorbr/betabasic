const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_action_add',
    execute: async (interaction) => {
        const modal = new ModalBuilder().setCustomId('modal_fstk_add').setTitle('Adicionar Veículo');

        const nameInput = new TextInputBuilder().setCustomId('v_name').setLabel('Nome do Veículo').setStyle(TextInputStyle.Short).setRequired(true);
        const catInput = new TextInputBuilder().setCustomId('v_cat').setLabel('Categoria (Carros/Motos/Utilitários/Premium)').setStyle(TextInputStyle.Short).setValue('Carros').setRequired(true);
        const priceInput = new TextInputBuilder().setCustomId('v_price').setLabel('Valor (Apenas números)').setStyle(TextInputStyle.Short).setRequired(true);
        const qtyInput = new TextInputBuilder().setCustomId('v_qty').setLabel('Quantidade em Estoque').setStyle(TextInputStyle.Short).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(catInput),
            new ActionRowBuilder().addComponents(priceInput),
            new ActionRowBuilder().addComponents(qtyInput)
        );

        await interaction.showModal(modal);
    }
};