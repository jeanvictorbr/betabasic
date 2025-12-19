const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('niveis')
        .setDescription('Sistema de Níveis de Voz do Koda.')
        .addSubcommand(sub => 
            sub.setName('ver')
                .setDescription('Vê a escada de níveis e seu progresso.')
        )
        .addSubcommand(sub => 
            sub.setName('configurar')
                .setDescription('ADMIN: Adiciona um cargo a um nível.')
                .addIntegerOption(op => op.setName('nivel').setDescription('Nível numérico (Ex: 10)').setRequired(true))
                .addRoleOption(op => op.setName('cargo').setDescription('Cargo para dar neste nível').setRequired(true))
                .addStringOption(op => op.setName('nome').setDescription('Nome do Elo (Ex: Ouro)').setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName('remover')
                .setDescription('ADMIN: Remove configuração de um nível.')
                .addIntegerOption(op => op.setName('nivel').setDescription('Nível para remover').setRequired(true))
        ),
};