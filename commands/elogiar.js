const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('elogiar')
        .setDescription('Envia um elogio/reputação para um usuário.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('Quem você quer elogiar?')
                .setRequired(true)
        ),
};