const db = require('../../database.js');

module.exports = {
    customId: 'profile_custom_theme_submit',
    async execute(interaction) {
        const imageUrl = interaction.fields.getTextInputValue('theme_image_url');
        const hexColor = interaction.fields.getTextInputValue('theme_color_hex');

        // Validação básica de Hex e URL
        const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
        if (!hexRegex.test(hexColor)) {
            return interaction.reply({ content: '❌ Cor inválida. Use o formato HEX (ex: #FF0000).', ephemeral: true });
        }

        if (!imageUrl.startsWith('http')) {
            return interaction.reply({ content: '❌ URL de imagem inválida.', ephemeral: true });
        }

        await db.query(`
            INSERT INTO user_profiles (user_id, theme_color, theme_image) 
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) 
            DO UPDATE SET theme_color = $2, theme_image = $3, last_updated = NOW()
        `, [interaction.user.id, hexColor, imageUrl]);

        await interaction.reply({ content: '✅ Tema personalizado salvo com sucesso!', ephemeral: true });
    }
};