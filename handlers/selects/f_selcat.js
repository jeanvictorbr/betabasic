const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const vehicleData = require('../../config/ferrariVehicles.js');

module.exports = {
    customId: 'f_selcat_', 
    async execute(interaction) {
        const type = interaction.customId.replace('f_selcat_', ''); // 'venda' ou 'troca'
        const selectedCategory = interaction.values[0];
        const vehicles = vehicleData[selectedCategory];

        if (!vehicles) return interaction.update({ content: '❌ Categoria inválida.', components: [] });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`f_selveh_${type}_${selectedCategory}`) // Ex: f_selveh_venda_Carros
            .setPlaceholder('Selecione o Veículo exato...')
            .addOptions(vehicles.map((v, index) => ({
                label: v.name,
                description: `Bruto: ${v.bruto} | Caixa: ${v.caixa}`,
                value: index.toString() // Mandamos o INDEX da array para evitar limite de caracteres no customId
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ 
            content: `**Operação de ${type.toUpperCase()} -> ${selectedCategory}**\nPasso 2: Selecione o veículo.`, 
            components: [row] 
        });
    }
};