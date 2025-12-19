const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Exibe seu cartão de perfil social Koda (Voz e Reputação).')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Ver o perfil de outro usuário')
                .setRequired(false)
        ),
};