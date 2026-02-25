const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-ferrari')
        .setDescription('[Módulo Ferrari] Envia o painel de intermediação para os corretores'),
    adminOnly: true,
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🏎️ NC - Central de Operações')
            .setDescription('Bem-vindo à central de registros. Selecione abaixo a operação que deseja realizar para atualizar o painel financeiro e os repasses ao caixa.')
            .setColor('#FF0000') // Vermelho Ferrari
            .setImage('https://i.imgur.com/8qgTz4Y.png'); // Coloque uma banner legal do cliente aqui

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('f_btn_venda').setLabel('Registrar Venda').setStyle(ButtonStyle.Success).setEmoji('💵'),
            new ButtonBuilder().setCustomId('f_btn_troca').setLabel('Registrar Troca').setStyle(ButtonStyle.Primary).setEmoji('🔄'),
            new ButtonBuilder().setCustomId('ferrari_meu_status').setLabel('Meu Status (Lucro/Caixa)').setStyle(ButtonStyle.Secondary).setEmoji('📊')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Painel enviado com sucesso!', ephemeral: true });
    }
};