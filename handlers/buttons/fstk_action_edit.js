const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_action_edit',
    execute: async (interaction) => {
        const categorias = ['Carros', 'Carros Premium', 'Motos', 'Utilitários'];
        const select = new StringSelectMenuBuilder()
            .setCustomId('fstk_sel_cat')
            .setPlaceholder('📂 Escolha a categoria do veículo...')
            .addOptions(categorias.map(c => ({ label: c, value: c, emoji: '📋' })));

        await interaction.update({ content: 'Selecione a categoria para encontrar o veículo:', embeds: [], components: [new ActionRowBuilder().addComponents(select)] });
    }
};