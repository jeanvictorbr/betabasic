const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ferrari-stats')
        .setDescription('[Módulo Ferrari] Mostra as estatísticas globais e o ranking de vendas'),
    adminOnly: true
};