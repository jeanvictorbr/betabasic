const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking_voz')
        .setDescription('Gerencia e visualiza o sistema de Ranking de Voz.')
        .addSubcommand(sub => 
            sub.setName('ver')
                .setDescription('Vê seu nível atual e progresso.')
                .addUserOption(op => op.setName('usuario').setDescription('Ver de outro usuário'))
        )
        .addSubcommand(sub => 
            sub.setName('setup')
                .setDescription('ADMIN: Cria automaticamente os cargos e configura o sistema.')
        ),
};