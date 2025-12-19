const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({ content: '❌ Você não pode se elogiar (seria muito egocêntrico!).', ephemeral: true });
        }

        if (targetUser.bot) {
            return interaction.reply({ content: '❌ Bots não precisam de elogios (nós não temos sentimentos... ainda).', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId(`elogiar_submit_${targetUser.id}`) // Passamos o ID no customId
            .setTitle(`Elogiar ${targetUser.username}`);

        const messageInput = new TextInputBuilder()
            .setCustomId('elogio_message')
            .setLabel('Seu Elogio')
            .setPlaceholder('Ex: Joga muito! / Muito gente boa!')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(100) // Texto curto para caber na imagem
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

        await interaction.showModal(modal);
    }
};