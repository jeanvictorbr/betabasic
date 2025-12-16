const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('social')
        .setDescription('Gerencie seu perfil social e reputação.')
        .addSubcommand(sub => 
            sub.setName('perfil')
               .setDescription('Exibe o seu cartão de perfil ou de outro usuário.')
               .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo')))
        .addSubcommand(sub => 
            sub.setName('elogiar')
               .setDescription('Dê reputação para alguém (1x a cada 24h).')
               .addUserOption(opt => opt.setName('usuario').setDescription('Quem merece o elogio?').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('bio')
               .setDescription('Defina a mensagem que aparece no seu perfil.')
               .addStringOption(opt => opt.setName('texto').setDescription('Sua biografia (Max 150 caracteres)').setRequired(true)))
        .addSubcommand(sub => 
            sub.setName('background')
               .setDescription('Defina a imagem de fundo do seu perfil.')
               .addStringOption(opt => opt.setName('url').setDescription('Link direto da imagem (JPG/PNG)').setRequired(true))),
    
    async execute(interaction) {
        // O roteamento para o handler será feito pelo index.js procurando 'social'
        // Mas a lógica estará no handler/commands/social.js
    },
};