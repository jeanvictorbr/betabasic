const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-youtube')
        .setDescription('Envia o arquivo de cookies do YouTube')
        .addAttachmentOption(option => 
            option.setName('arquivo')
                .setDescription('O arquivo .json exportado do Cookie-Editor')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    adminOnly: true,
    module: 'music'
};