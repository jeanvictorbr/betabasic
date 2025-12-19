const db = require('../../database.js');

module.exports = {
    customId: 'profile_bio_submit',
    async execute(interaction) {
        const bio = interaction.fields.getTextInputValue('bio_text');

        await db.query(`
            INSERT INTO user_profiles (user_id, bio) 
            VALUES ($1, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET bio = $2, last_updated = NOW()
        `, [interaction.user.id, bio]);

        await interaction.reply({ content: '✅ Bio atualizada com sucesso!', ephemeral: true });
    }
};