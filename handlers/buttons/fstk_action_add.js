const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_action_add',
    execute: async (interaction) => {
        const categorias = ['Carros', 'Carros Premium', 'Motos', 'Utilitários'];
        
        const select = new StringSelectMenuBuilder()
            .setCustomId('fstk_sel_cat_add')
            .setPlaceholder('📂 Qual a categoria do NOVO veículo?')
            .addOptions(categorias.map(c => ({ label: c, value: c, emoji: '📋' })));

        await interaction.update({
            content: 'Selecione a **Categoria** em que o veículo será cadastrado:',
            embeds: [],
            components: [new ActionRowBuilder().addComponents(select)]
        });
    }
};