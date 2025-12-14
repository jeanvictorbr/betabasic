const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

// Configurações do Play-DL (Opcional: Adicione seu ClientID do SoundCloud se tiver, senão ele usa o público)
play.getFreeClientID().then((clientID) => {
    play.setToken({
        soundcloud: {
            client_id: clientID
        }
    });
});

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música do SoundCloud',
        options: [
            {
                name: 'busca',
                type: 3, // STRING
                description: 'Nome da música ou Link do SoundCloud',
                required: true
            }
        ]
    },
    async execute(interaction) {
        await interaction.deferReply();

        const channel = interaction.member.voice.channel;
        if (!channel) {
            return interaction.editReply('❌ Você precisa estar em um canal de voz.');
        }

        const query = interaction.options.getString('busca');
        let trackInfo;
        let isUrl = false;

        try {
            // --- 1. LÓGICA DE BUSCA (A CORREÇÃO) ---
            
            // Verifica se é LINK ou TEXTO
            if (query.startsWith('http')) {
                // Valida se é SoundCloud
                const type = await play.validate(query); 
                if (type === 'so_track') {
                    const scInfo = await play.soundcloud(query);
                    trackInfo = scInfo;
                    isUrl = true;
                } else {
                    return interaction.editReply('❌ Apenas links do **SoundCloud** são suportados neste momento.');
                }
            } else {
                // É uma busca por TEXTO (Nome da música)
                const results = await play.search(query, {
                    source: { soundcloud: 'tracks' }, // FORÇA SoundCloud
                    limit: 1
                });

                if (results.length === 0) {
                    return interaction.editReply('❌ Nenhuma música encontrada no SoundCloud com este nome.');
                }
                trackInfo = results[0];
            }

            // --- 2. SISTEMA DE PLAYER ---
            
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            // Extrai o Stream de Áudio
            const stream = await play.stream(trackInfo.url);
            
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            });

            player.play(resource);
            connection.subscribe(player);

            // --- 3. RESPOSTA VISUAL ---
            
            const embed = new EmbedBuilder()
                .setTitle('🎶 Tocando Agora (SoundCloud)')
                .setDescription(`**[${trackInfo.name}](${trackInfo.url})**`)
                .addFields(
                    { name: 'Duração', value: trackInfo.durationInSec ? `${Math.floor(trackInfo.durationInSec / 60)}:${(trackInfo.durationInSec % 60).toString().padStart(2, '0')}` : 'Live', inline: true },
                    { name: 'Artista', value: trackInfo.user ? trackInfo.user.name : 'Desconhecido', inline: true }
                )
                .setThumbnail(trackInfo.thumbnail)
                .setColor('#ff5500'); // Cor oficial do SoundCloud

            await interaction.editReply({ embeds: [embed] });

            // Tratamento de erros do player
            player.on('error', error => {
                console.error('Erro no player:', error);
                interaction.followUp({ content: '❌ Erro ao reproduzir o áudio.', ephemeral: true });
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Ocorreu um erro ao tentar processar sua música. Verifique se o link é válido.');
        }
    }
};