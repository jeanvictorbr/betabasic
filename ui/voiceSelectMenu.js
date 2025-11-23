const { ChannelType } = require('discord.js');

module.exports = function generateVoiceSelectMenu(guild, channels) {
    // Filtra apenas canais de voz e limita a 25 (limite do Discord)
    const voiceChannels = channels
        .filter(c => c.type === ChannelType.GuildVoice)
        .sort((a, b) => a.position - b.position)
        .slice(0, 25);

    if (voiceChannels.size === 0) {
        return {
            components: [{
                type: 17,
                components: [{ type: 10, content: "❌ Nenhum canal de voz encontrado neste servidor." }]
            }]
        };
    }

    const options = voiceChannels.map(channel => ({
        label: channel.name,
        value: channel.id,
        description: `ID: ${channel.id}`,
        emoji: { name: "🔊" }
    }));

    // Adiciona opção de desconectar
    options.unshift({
        label: "Desconectar Bot",
        value: "disconnect",
        description: "Remove o bot de qualquer canal de voz.",
        emoji: { name: "❌" }
    });

    return {
        components: [{
            type: 17,
            components: [
                { type: 10, content: "### 🔊 Controle de Presença de Voz" },
                { type: 10, content: "Selecione um canal para o bot entrar e ficar **mutado/ensurdecido**." },
                { type: 14, divider: true, spacing: 2 },
                {
                    type: 1,
                    components: [{
                        type: 3,
                        custom_id: "voice_join_channel",
                        options: options,
                        placeholder: "Selecione um canal de voz...",
                        min_values: 1,
                        max_values: 1
                    }]
                }
            ]
        }]
    };
};