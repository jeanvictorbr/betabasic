const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const vehicleData = require('../../config/ferrariVehicles.js');

module.exports = {
    customId: 'f_btn_', // Pegará 'f_btn_venda' e 'f_btn_troca' (Certifique-se de que sua index.js suporta dinâmicos .startsWith)
    async execute(interaction) {
        const type = interaction.customId.replace('f_btn_', ''); // Retorna 'venda' ou 'troca'
        
        // Gera o menu de categorias dinamicamente a partir do config
        const categories = Object.keys(vehicleData);
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`f_selcat_${type}`)
            .setPlaceholder('Selecione a Categoria do Veículo...')
            .addOptions(categories.map(cat => ({
                label: cat,
                value: cat,
                emoji: '🚗'
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ 
            content: `**Operação de ${type.toUpperCase()}**\nPasso 1: Selecione a categoria do veículo.`, 
            components: [row], 
            ephemeral: true 
        });
    }
};