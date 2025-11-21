// Arquivo: handlers/buttons/store_cv_publish_start_.js
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'store_cv_publish_start_', // Prefixo para detecção dinâmica
    execute: async (interaction) => {
        const categoryId = interaction.customId.split('_').pop();

        // Resposta correta para Discord.js v14
        await interaction.update({
            content: '📢 **Onde você deseja publicar esta vitrine?**\nSelecione o canal abaixo.',
            components: [{
                type: 1, // Action Row
                components: [{
                    type: 8, // Channel Select
                    custom_id: `store_cv_sel_channel_${categoryId}`,
                    channel_types: [0], // Apenas canais de texto (GuildText)
                    placeholder: 'Selecione o canal da vitrine'
                }]
            }],
            flags: EPHEMERAL_FLAG | V2_FLAG
        });
    }
};