const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_sel_cat_add',
    execute: async (interaction) => {
        // Pega a categoria que ele escolheu no menu
        const categoria = interaction.values[0];
        
        // Esconde a categoria no ID do modal para o bot lembrar depois
        const safeCat = categoria.replace(/\s+/g, '-');
        
        const modal = new ModalBuilder()
            .setCustomId(`modal_fstk_add_${safeCat}`)
            .setTitle(`Novo: ${categoria}`);

        const nameInput = new TextInputBuilder().setCustomId('v_name').setLabel('Nome do Veículo').setStyle(TextInputStyle.Short).setRequired(true);
        const priceInput = new TextInputBuilder().setCustomId('v_price').setLabel('Valor (Apenas números)').setStyle(TextInputStyle.Short).setRequired(true);
        const qtyInput = new TextInputBuilder().setCustomId('v_qty').setLabel('Quantidade Inicial').setStyle(TextInputStyle.Short).setRequired(true);

        // Repare: Não tem mais a caixa de texto pedindo a categoria!
        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(priceInput),
            new ActionRowBuilder().addComponents(qtyInput)
        );

        // Abre o popup na tela do Staff
        await interaction.showModal(modal);
    }
};