const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ferrari-config')
        .setDescription('[Módulo Ferrari] Configura canais, cargos e vitrine')
        .addChannelOption(opt => opt.setName('canal_logs').setDescription('Canal para receber as logs de vendas'))
        .addRoleOption(opt => opt.setName('cargo_staff').setDescription('Cargo que gerencia as vendas e carrinhos'))
        .addStringOption(opt => opt.setName('vitrine_titulo').setDescription('Título da vitrine de stock'))
        .addStringOption(opt => opt.setName('vitrine_desc').setDescription('Descrição da vitrine de stock'))
        .addStringOption(opt => opt.setName('vitrine_imagem').setDescription('Link da imagem da vitrine')),
    adminOnly: true
};