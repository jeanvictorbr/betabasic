const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_sel_cat_add',
    execute: async (interaction) => {
        const categoria = interaction.values[0];
        
        // Esconde a categoria no ID do modal
        const safeCat = categoria.replace(/\s+/g, '-');
        
        const modal = new ModalBuilder()
            .setCustomId(`modal_fstk_add_${safeCat}`)
            .setTitle(`Novo: ${categoria}`);

        const nameInput = new TextInputBuilder().setCustomId('v_name').setLabel('Nome do Veículo').setStyle(TextInputStyle.Short).setRequired(true);
        const priceInput = new TextInputBuilder().setCustomId('v_price').setLabel('Valor (Apenas números)').setStyle(TextInputStyle.Short).setRequired(true);
        const qtyInput = new TextInputBuilder().setCustomId('v_qty').setLabel('Quantidade Inicial').setStyle(TextInputStyle.Short).setRequired(true);
        
        // 🔴 NOVOS CAMPOS ADICIONADOS AQUI (Opcionais)
        const msgInput = new TextInputBuilder().setCustomId('v_msg').setLabel('Mensagem Pós-Compra (Opcional)').setStyle(TextInputStyle.Paragraph).setRequired(false);
        const imgInput = new TextInputBuilder().setCustomId('v_img').setLabel('URL da Imagem (Ex: Link do Imgur/Discord)').setStyle(TextInputStyle.Short).setRequired(false);

        // Discord só aceita 5 linhas. Usamos exatamente as 5!
        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(priceInput),
            new ActionRowBuilder().addComponents(qtyInput),
            new ActionRowBuilder().addComponents(msgInput),
            new ActionRowBuilder().addComponents(imgInput)
        );

        await interaction.showModal(modal);
    }
};