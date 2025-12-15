const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-tickets')
        .setDescription('Painel Administrativo para ver e fechar tickets abertos')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    adminOnly: true, // Se seu bot usa essa flag interna
    category: 'admin'
};