const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Toca música usando um Bot Assistente')
        .addStringOption(option =>
            option.setName('busca')
                .setDescription('Nome da música ou Link (Spotify/Youtube/Soundcloud)')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Redireciona para o handler
        const handler = interaction.client.commandHandlers.get('play');
        if (handler) await handler(interaction);
    }
};