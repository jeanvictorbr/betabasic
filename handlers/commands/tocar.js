const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música (Modo Android Bypass)',
        options: [
            {
                name: 'busca',
                type: 3,
                description: 'Nome da música ou Link',
                required: true
            }
        ]
    },
    async execute(interaction) {
        await interaction.deferReply();
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.editReply('❌ Canal de voz necessário.');

        // --- TRUQUE 1: Fingir ser um Celular Android ---
        // Isso às vezes evita o erro "Sign in to confirm you are not a bot"
        try {
            play.setToken({
                useragent: ['Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36']
            });
            
            // Tenta pegar um ID do SoundCloud para emergências
            if (!process.env.SOUNDCLOUD_CLIENT_ID) {
                const freeID = await play.getFreeClientID().catch(() => null);
                if (freeID) play.setToken({ soundcloud: { client_id: freeID } });
            } else {
                play.setToken({ soundcloud: { client_id: process.env.SOUNDCLOUD_CLIENT_ID } });
            }
        } catch (e) {}

        const query = interaction.options.getString('busca');
        let stream;
        let trackInfo;

        try {
            // --- LÓGICA DE PROCURA ---
            if (query.startsWith('http')) {
                // É LINK
                const type = await play.validate(query); 
                
                if (type === 'yt_video') {
                    // Tenta YouTube com o disfarce de Android
                    const ytInfo = await play.video_info(query);
                    trackInfo = {
                        title: ytInfo.video_details.title,
                        url: ytInfo.video_details.url,
                        duration: ytInfo.video_details.durationRaw,
                        thumbnail: ytInfo.video_details.thumbnails[0]?.url
                    };
                    stream = await play.stream(query);
                } 
                else if (type === 'so_track') {
                    // SoundCloud direto
                    const scInfo = await play.soundcloud(query);
                    trackInfo = { title: scInfo.name, url: scInfo.url, duration: 'SoundCloud', thumbnail: scInfo.thumbnail };
                    stream = await play.stream(scInfo.url);
                }
                else {
                    return interaction.editReply('❌ Link não suportado.');
                }
            } else {
                // É TEXTO (BUSCA)
                // O Pulo do Gato: Se o YouTube falhar, ele pula pro SoundCloud SOZINHO
                try {
                    // Tenta YouTube primeiro
                    const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
                    if (results.length > 0) {
                        const video = results[0];
                        trackInfo = {
                            title: video.title,
                            url: video.url,
                            duration: video.durationRaw,
                            thumbnail: video.thumbnails[0]?.url
                        };
                        stream = await play.stream(video.url);
                    } else {
                        throw new Error('Nada no YT');
                    }
                } catch (ytError) {
                    console.log('YouTube falhou, tentando SoundCloud...', ytError.message);
                    
                    // FALLBACK: Se o YouTube bloqueou, busca no SoundCloud transparente
                    const scResults = await play.search(query, { limit: 1, source: { soundcloud: 'tracks' } });
                    if (!scResults || scResults.length === 0) return interaction.editReply('❌ Erro: YouTube bloqueou o IP e não achei no SoundCloud.');
                    
                    const scTrack = scResults[0];
                    trackInfo = {
                        title: scTrack.name,
                        url: scTrack.url,
                        duration: 'SoundCloud (Backup)',
                        thumbnail: scTrack.thumbnail
                    };
                    stream = await play.stream(scTrack.url);
                }
            }

            // --- TOCAR ---
            const resource = createAudioResource(stream.stream, { inputType: stream.type });
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });

            player.play(resource);
            connection.subscribe(player);

            const embed = new EmbedBuilder()
                .setTitle(trackInfo.duration.includes('Backup') ? '🎶 Tocando (Modo Backup)' : '🎶 Tocando Agora')
                .setDescription(`**[${trackInfo.title}](${trackInfo.url})**`)
                .setThumbnail(trackInfo.thumbnail)
                .setColor(trackInfo.duration.includes('Backup') ? 'Orange' : 'Red');

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro Final:', error);
            await interaction.editReply('❌ Não foi possível tocar. O bloqueio da hospedagem está muito forte.');
        }
    }
};