const db = require('../../database.js');
const getVoicePanel = require('../../ui/voiceControlPanel.js');
const V2_FLAG = 1 << 15;

module.exports = {
    customId: 'voice_rename_submit_', // O index.js deve capturar prefixos com _
    run: async (interaction, channelId) => {
        const newName = interaction.fields.getTextInputValue('new_name');
        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) return interaction.reply({ content: "Canal não encontrado.", ephemeral: true });

        // Renomear (Discord tem rate limit de 2x a cada 10 min, avise o usuário se der erro)
        try {
            await channel.setName(newName);
        } catch (err) {
            return interaction.reply({ content: "⏳ Você está mudando o nome muito rápido! Tente daqui a pouco.", ephemeral: true });
        }

        // Buscar dados atuais para redesenhar o painel
        const tempVoice = await db.query('SELECT * FROM temp_voices WHERE channel_id = $1', [channelId]);
        
        // Se a mensagem original do painel estiver visível no canal, tentamos atualizar ela silenciosamente
        // Como o modal é uma nova interação, a atualização do painel precisa ser feita editando a mensagem original se tivermos referência, 
        // ou enviando um novo painel. 
        // SIMPLIFICAÇÃO: Apenas confirmamos. O painel antigo ficará com nome antigo até alguém clicar num botão.
        // OPÇÃO MELHOR: Enviar uma mensagem "Painel Atualizado" com a nova UI.
        
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