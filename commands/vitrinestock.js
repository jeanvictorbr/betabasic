const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vitrinestock')
        .setDescription('[Loja Stock] Envia a vitrine do estoque adicionado manualmente'),
    adminOnly: true
};