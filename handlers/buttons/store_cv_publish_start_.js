const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'store_cv_publish_start_',
    execute: async (interaction) => {
        const categoryId = interaction.customId.split('_').pop();

        const response = {
            type: 17,
            body: {
                flags: EPHEMERAL_FLAG | V2_FLAG,
                content: '📢 **Onde você deseja publicar esta vitrine?**\nSelecione o canal abaixo.',
                components: [{
                    type: 1,
                    components: [{
                        type: 8, // Channel Select
                        custom_id: `store_cv_sel_channel_${categoryId}`,
                        channel_types: [0], // Apenas texto
                        placeholder: 'Selecione o canal da vitrine'
                    }]
                }]
            }
        };

        await interaction.update(response);
    }
};