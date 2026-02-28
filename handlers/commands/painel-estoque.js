const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (interaction, guildSettings) => {
    const embed = new EmbedBuilder()
        .setTitle('📦 Gestão Rápida de Estoque')
        .setDescription('Clique no botão abaixo para acessar o painel de veículos e atualizar o estoque.\n\n*Apenas membros da Staff podem usar esta função.*')
        .setColor('#3b82f6')
        .setFooter({ text: 'Sistema Sincronizado com o Site e Vitrines' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('fstk_open').setLabel('Gerenciar Estoque').setStyle(ButtonStyle.Primary).setEmoji('📦')
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Painel de Estoque publicado neste canal com sucesso!', ephemeral: true });
};