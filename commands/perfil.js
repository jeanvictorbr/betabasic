const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Exibe o cartão de perfil social do Koda.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('O usuário para ver o perfil (opcional)')
                .setRequired(false)
        ),
};