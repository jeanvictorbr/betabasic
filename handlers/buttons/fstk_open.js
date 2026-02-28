const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_open',
    execute: async (interaction, guildSettings) => {
        // Trava de Segurança
        if (guildSettings?.ferrari_staff_role && !interaction.member.roles.cache.has(guildSettings.ferrari_staff_role) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Você não tem permissão da Staff para gerenciar o estoque.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Central de Estoque')
            .setDescription('O que você deseja fazer no estoque da loja?')
            .setColor('#3b82f6');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fstk_action_add').setLabel('Adicionar Novo Veículo').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId('fstk_action_edit').setLabel('Editar/Excluir Veículo').setStyle(ButtonStyle.Primary).setEmoji('✏️')
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};