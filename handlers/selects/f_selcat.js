const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const vehicleData = require('../../config/ferrariVehicles.js');

module.exports = {
    customId: 'f_selcat_', 
    async execute(interaction) {
        const type = interaction.customId.replace('f_selcat_', ''); 
        const selectedCategory = interaction.values[0];
        const vehicles = vehicleData[selectedCategory];

        if (!vehicles) return interaction.update({ content: '❌ Categoria inválida.', components: [] });

        const components = [];
        
        // Fatiar de 25 em 25 para evitar o erro do Discord
        for (let i = 0; i < vehicles.length; i += 25) {
            const chunk = vehicles.slice(i, i + 25);
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`f_selveh_${type}_${selectedCategory}_${i}`) 
                .setPlaceholder(`Selecione o Veículo (${i + 1} a ${i + chunk.length})...`)
                .addOptions(chunk.map((v, index) => ({
                    label: v.name,
                    description: `Bruto: ${v.bruto} | Caixa: ${v.caixa}`,
                    value: (i + index).toString() // O valor é o index real absoluto
                })));

            components.push(new ActionRowBuilder().addComponents(selectMenu));
        }

        await interaction.update({ 
            content: `**Operação de ${type.toUpperCase()} -> ${selectedCategory}**\nPasso 2: Selecione o veículo na lista abaixo.`, 
            components: components 
        });
    }
};