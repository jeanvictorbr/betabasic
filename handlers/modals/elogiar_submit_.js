const db = require('../../database.js');

module.exports = {
    customId: 'elogiar_submit_', // O index deve pegar "elogiar_submit_12345"
    async execute(interaction) {
        // Extrai o ID do alvo do customId (elogiar_submit_IDUSER)
        const targetId = interaction.customId.split('_')[2];
        const message = interaction.fields.getTextInputValue('elogio_message');

        if (!targetId) return interaction.reply({ content: 'Erro ao identificar usuário.', ephemeral: true });

        // Validação anti-spam simples (Opcional: verificar se já elogiou hoje)
        
        await db.query(`
            INSERT INTO user_reputation (target_id, author_id, message)
            VALUES ($1, $2, $3)
        `, [targetId, interaction.user.id, message]);

        const targetUser = await interaction.client.users.fetch(targetId).catch(() => null);
        const name = targetUser ? targetUser.username : 'usuário';

        await interaction.reply({ 
            content: `✅ Você enviou um elogio para **${name}**!\n> *"${message}"*\nIsso aparecerá no perfil dele(a).`, 
            ephemeral: true 
        });
    }
};