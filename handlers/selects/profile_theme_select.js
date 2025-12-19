const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'profile_theme_select',
    async execute(interaction) {
        const selectedValue = interaction.values[0];

        // Se escolheu "Tema Próprio", abrimos um modal para a URL da imagem
        if (selectedValue === 'custom_theme') {
            const modal = new ModalBuilder()
                .setCustomId('profile_custom_theme_submit')
                .setTitle('Personalizar Tema');

            const imageInput = new TextInputBuilder()
                .setCustomId('theme_image_url')
                .setLabel('URL da Imagem (Fundo/Banner)')
                .setPlaceholder('https://imgur.com/...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const colorInput = new TextInputBuilder()
                .setCustomId('theme_color_hex')
                .setLabel('Cor Hex (Ex: #FF0000)')
                .setPlaceholder('#FFFFFF')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(7)
                .setMaxLength(7);

            modal.addComponents(
                new ActionRowBuilder().addComponents(imageInput),
                new ActionRowBuilder().addComponents(colorInput)
            );

            return interaction.showModal(modal);
        }

        // Se escolheu um preset, salvamos direto
        await db.query(`
            INSERT INTO user_profiles (user_id, theme_color, theme_image) 
            VALUES ($1, $2, NULL)
            ON CONFLICT (user_id) 
            DO UPDATE SET theme_color = $2, theme_image = NULL, last_updated = NOW()
        `, [interaction.user.id, selectedValue]);

        await interaction.update({ 
            content: `✅ Tema atualizado para a cor **${selectedValue}**! Use /perfil para ver.`, 
            components: [] 
        });
    }
};