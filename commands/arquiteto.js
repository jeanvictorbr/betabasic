const { SlashCommandBuilder } = require('discord.js');
const { V2_FLAG } = require('../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('arquiteto')
        .setDescription('Inicia o assistente de arquitetura de servidor (Premium).'),
    v2: V2_FLAG,
    execute: async (interaction, client) => {
        // Este comando agora será tratado pelo handler/commands/arquiteto.js
        // que já existe e funciona.
    }
};