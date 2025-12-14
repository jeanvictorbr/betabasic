const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-youtube')
        .setDescription('Configura o Cookie do YouTube (Anti-Bloqueio)')
        .addStringOption(option => 
            option.setName('json')
                .setDescription('Cole o JSON copiado da extensão Cookie-Editor')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Apenas Admins podem ver
        
    // Metadados extras para seu sistema interno (opcional)
    adminOnly: true,
    module: 'music'
};