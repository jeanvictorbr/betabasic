const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-estoque')
        .setDescription('[Loja] Envia o painel interativo de gestão de estoque para a Staff.'),
    adminOnly: true
};