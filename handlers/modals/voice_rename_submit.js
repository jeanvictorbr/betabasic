const getVoicePanel = require('../../ui/voiceControlPanel.js');
const V2_FLAG = 1 << 15;

module.exports = {
    customId: 'voice_rename_submit_',
    async execute(interaction, client, db) {
        const channelId = interaction.customId.split('_').pop();
        const newName = interaction.fields.getTextInputValue('new_name');
        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) return interaction.reply({ content: "Canal não encontrado.", ephemeral: true });

        // Renomear (Discord tem rate limit de 2x a cada 10 min)
        try {
            await channel.setName(newName);
        } catch (err) {
            return interaction.reply({ content: "⏳ Você está mudando o nome muito rápido! Tente daqui a pouco.", ephemeral: true });
        }

        // Buscar dados atuais para redesenhar o painel
        const tempVoice = await db.query('SELECT * FROM temp_voices WHERE channel_id = $1', [channelId]);
        
        const newUI = getVoicePanel({
            channelName: newName,
            channelId: channelId,
            ownerId: interaction.user.id,
            isLocked: tempVoice.rows[0]?.is_locked || false,
            isHidden: tempVoice.rows[0]?.is_hidden || false,
            userLimit: channel.userLimit
        });

        await interaction.reply({ 
            content: `✅ Nome alterado para **${newName}**!`, 
            components: newUI.components, 
            flags: V2_FLAG,
            ephemeral: true 
        });
    }
};