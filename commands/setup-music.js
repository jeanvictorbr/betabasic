// commands/setup-music.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-music')
        .setDescription('🎹 Gerencia os Bots de Música (Workers)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => 
            sub.setName('add-worker')
                .setDescription('Adiciona um novo bot de música ao cluster')
                .addStringOption(option => 
                    option.setName('token')
                        .setDescription('O Token do Bot (Worker)')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('client_id')
                        .setDescription('O ID do Bot (Worker)')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('nome')
                        .setDescription('Nome para identificação (ex: Music 02)')
                        .setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('list-workers')
                .setDescription('Lista os bots de música cadastrados')),
    adminOnly: true, // Proteção extra do seu handler
    async execute(interaction) {
        // Redireciona para o handler
        const handler = interaction.client.commandHandlers.get('setup-music');
        if (handler) await handler(interaction);
    }
};