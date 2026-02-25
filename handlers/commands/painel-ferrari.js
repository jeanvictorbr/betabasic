const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = async (interaction, guildSettings) => {
    // Puxa a imagem customizada. Se o dono não setou nada, usa um vermelho padrão transparente ou vazio
    const image = guildSettings?.ferrari_vitrine_image || null;

    const embed = new EmbedBuilder()
        .setTitle('🏎️ NC - Central de Operações')
        .setDescription('Bem-vindo à central de registros. Selecione abaixo a operação que deseja realizar para atualizar o painel financeiro e os repasses ao caixa.')
        .setColor('#FF0000'); // Vermelho Ferrari
        
    if (image && image.startsWith('http')) {
        embed.setImage(image);
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('f_btn_venda').setLabel('Registrar Venda').setStyle(ButtonStyle.Success).setEmoji('💵'),
        new ButtonBuilder().setCustomId('f_btn_troca').setLabel('Registrar Troca').setStyle(ButtonStyle.Primary).setEmoji('🔄'),
        new ButtonBuilder().setCustomId('ferrari_meu_status').setLabel('Meu Status (Lucro/Caixa)').setStyle(ButtonStyle.Secondary).setEmoji('📊')
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Painel enviado com sucesso!', ephemeral: true });
    
    // Deleta o '✅ Painel enviado' do admin após 5 segundos
    setTimeout(() => interaction.deleteReply().catch(()=>{}), 5000); 
};