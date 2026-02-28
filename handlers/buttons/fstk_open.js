const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    customId: 'fstk_open',
    execute: async (interaction, guildSettings) => {
        // Trava de Segurança: Só Staff ou Admin abre o painel
        if (guildSettings?.ferrari_staff_role && !interaction.member.roles.cache.has(guildSettings.ferrari_staff_role) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Você não tem permissão da Staff para gerenciar o estoque.', ephemeral: true });
        }

        const categorias = ['Carros', 'Carros Premium', 'Motos', 'Utilitários'];
        const select = new StringSelectMenuBuilder()
            .setCustomId('fstk_sel_cat')
            .setPlaceholder('📂 Escolha a categoria do veículo...')
            .addOptions(categorias.map(c => ({ label: c, value: c, emoji: '📋' })));

        await interaction.reply({ 
            content: 'Selecione a **Categoria** para encontrar o veículo:', 
            components: [new ActionRowBuilder().addComponents(select)], 
            ephemeral: true 
        });
    }
};