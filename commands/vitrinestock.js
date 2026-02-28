const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vitrinestock')
        .setDescription('[Loja Stock] Envia a vitrine do estoque separada por categoria')
        .addStringOption(option => 
            option.setName('categoria')
                .setDescription('Escolha qual categoria de veículos postar neste canal')
                .setRequired(true)
                .addChoices(
                    { name: 'Carros', value: 'Carros' },
                    { name: 'Carros Premium', value: 'Carros Premium' },
                    { name: 'Motos', value: 'Motos' },
                    { name: 'Utilitários', value: 'Utilitários' },
                    { name: 'Todos (Misto)', value: 'Todos' }
                )
        ),
    adminOnly: true
};