const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música do YouTube ou SoundCloud',
        options: [
            {
                name: 'busca',
                type: 3, // STRING
                description: 'Nome da música ou Link (YouTube/SoundCloud)',
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
        let stream;
        let trackInfo;

        try {
            // --- LÓGICA HÍBRIDA (YouTube + SoundCloud) ---
            
            // 1. Verifica se é um LINK
            if (query.startsWith('http')) {
                const type = await play.validate(query); 

                if (type === 'yt_video') {
                    // LINK DO YOUTUBE
                    const ytInfo = await play.video_info(query);
                    trackInfo = {
                        title: ytInfo.video_details.title,
                        url: ytInfo.video_details.url,
                        duration: ytInfo.video_details.durationRaw,
                        thumbnail: ytInfo.video_details.thumbnails[0].url
                    };
                    stream = await play.stream(query);

                } else if (type === 'so_track') {
                    // LINK DO SOUNDCLOUD (Ainda tenta, se tiver chave no .env)
                    // Se não tiver chave, isso aqui pode falhar, mas o foco agora é YT
                    trackInfo = await play.soundcloud(query);
                    trackInfo = {
                        title: trackInfo.name,
                        url: trackInfo.url,
                        duration: 'SoundCloud',
                        thumbnail: trackInfo.thumbnail
                    };
                    stream = await play.stream(trackInfo.url);
                } else {
                    return interaction.editReply('❌ Link não suportado. Use links do YouTube ou SoundCloud.');
                }
            } else {
                // 2. BUSCA POR TEXTO (Agora usa YouTube por padrão -> Mais estável)
                const results = await play.search(query, {
                    limit: 1,
                    source: { youtube: 'video' } // Mudamos para YouTube
                });

                if (results.length === 0) {
                    return interaction.editReply('❌ Nenhuma música encontrada.');
                }

                const ytVideo = results[0];
                trackInfo = {
                    title: ytVideo.title,
                    url: ytVideo.url,
                    duration: ytVideo.durationRaw,
                    thumbnail: ytVideo.thumbnails[0].url
                };

                stream = await play.stream(ytVideo.url);
            }

            // --- PLAYER ---
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer({
                behaviors: { noSubscriber: NoSubscriberBehavior.Play }
            });

            player.play(resource);
            connection.subscribe(player);

            const embed = new EmbedBuilder()
                .setTitle('🎶 Tocando Agora')
                .setDescription(`**[${trackInfo.title}](${trackInfo.url})**`)
                .addFields(
                    { name: 'Duração', value: trackInfo.duration || 'Live', inline: true }
                )
                .setThumbnail(trackInfo.thumbnail)
                .setColor('#FF0000'); // Vermelho YouTube

            await interaction.editReply({ embeds: [embed] });

            player.on('error', error => {
                console.error('Erro no player:', error);
                if (!interaction.replied) interaction.followUp({ content: '❌ Erro ao reproduzir áudio.', ephemeral: true });
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro crítico. O YouTube pode ter bloqueado o IP da hospedagem ou o link é inválido.');
        }
    }
};