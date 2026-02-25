const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-ferrari')
        .setDescription('[Módulo Ferrari] Envia o painel de intermediação para os corretores'),
    adminOnly: true
};