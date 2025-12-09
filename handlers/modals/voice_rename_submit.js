const db = require('../../database.js'); // Importação obrigatória
const getVoicePanel = require('../../ui/voiceControlPanel.js');
const V2_FLAG = 1 << 15;

module.exports = {
    customId: 'voice_rename_submit_',
    async execute(interaction) {
        const channelId = interaction.customId.split('_').pop();
        const newName = interaction.fields.getTextInputValue('new_name');
        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) return interaction.reply({ content: "Canal não encontrado.", ephemeral: true });

        try {
            await channel.setName(newName);
        } catch (err) {
            return interaction.reply({ content: "⏳ Rate limit do Discord. Tente daqui a pouco.", ephemeral: true });
        }

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