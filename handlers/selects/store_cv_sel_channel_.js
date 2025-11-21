const db = require('../../database');
const updateStoreVitrine = require('../../utils/updateStoreVitrine');

module.exports = {
    customId: 'store_cv_sel_channel_',
    execute: async (interaction) => {
        const client = interaction.client;
        const categoryId = interaction.customId.split('_').pop();
        const channelId = interaction.values[0];

        const channel = await interaction.guild.channels.fetch(channelId);
        if (!channel) return interaction.reply({ content: 'Canal inválido.', ephemeral: true });

        await interaction.deferUpdate();

        // Envia placeholder
        const msg = await channel.send({ content: '🔄 **Carregando vitrine da categoria...**' });

        // Salva no DB
        await db.query(
            'UPDATE store_categories SET vitrine_channel_id = $1, vitrine_message_id = $2 WHERE id = $3',
            [channelId, msg.id, categoryId]
        );

        // Monta vitrine real
        await updateStoreVitrine(client, interaction.guild.id, categoryId);

        await interaction.followUp({ content: `✅ **Sucesso!** A vitrine da categoria foi publicada em ${channel}.`, ephemeral: true });
    }
};