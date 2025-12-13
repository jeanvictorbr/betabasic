const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'aut_pnl_add_role_',
    async execute(interaction) {
        const panelId = interaction.customId.split('_')[4];
        
        // Verifica limite de 25
        // (Opcional: fazer query antes para checar se já tem 25)

        const modal = new ModalBuilder()
            .setCustomId(`modal_pnl_add_role_${panelId}`)
            .setTitle('Adicionar Opção ao Menu');

        const roleInput = new TextInputBuilder().setCustomId('in_role').setLabel("ID do Cargo").setPlaceholder("Ex: 123456789...").setStyle(TextInputStyle.Short).setRequired(true);
        const labelInput = new TextInputBuilder().setCustomId('in_label').setLabel("Nome no Menu").setPlaceholder("Ex: Notificações").setStyle(TextInputStyle.Short).setRequired(true);
        const emojiInput = new TextInputBuilder().setCustomId('in_emoji').setLabel("Emoji (Opcional)").setPlaceholder("🔔").setStyle(TextInputStyle.Short).setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(roleInput),
            new ActionRowBuilder().addComponents(labelInput),
            new ActionRowBuilder().addComponents(emojiInput)
        );

        await interaction.showModal(modal);
    }
};