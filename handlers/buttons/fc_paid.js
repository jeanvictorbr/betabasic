module.exports = {
    customId: 'fc_paid',
    async execute(interaction, guildSettings) {
        const staffRole = guildSettings?.ferrari_staff_role ? `<@&${guildSettings.ferrari_staff_role}>` : '@here';
        await interaction.reply({ content: `🔔 ${staffRole} O cliente **${interaction.user.username}** informou que efetuou o pagamento e aguarda liberação!` });
    }
};