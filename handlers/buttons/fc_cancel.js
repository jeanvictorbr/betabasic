module.exports = {
    customId: 'fc_cancel',
    async execute(interaction, guildSettings) {
        if (!guildSettings?.ferrari_staff_role || !interaction.member.roles.cache.has(guildSettings.ferrari_staff_role)) {
            return interaction.reply({ content: '❌ Apenas a Staff pode cancelar o carrinho.', ephemeral: true });
        }
        await interaction.reply({ content: '🗑️ Carrinho cancelado pela Staff. Fechando em 10 segundos...' });
        setTimeout(() => interaction.channel.delete().catch(()=>{}), 10000);
    }
};