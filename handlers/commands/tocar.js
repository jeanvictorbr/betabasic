const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música do YouTube (Login Forçado)',
        options: [
            {
                name: 'busca',
                type: 3, // STRING
                description: 'Nome da música ou Link',
                required: true
            }
        ]
    },
    async execute(interaction) {
        await interaction.deferReply();

        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.editReply('❌ Entre em um canal de voz.');

        try {
            // --- AQUI ESTÁ O "LOGIN" COM O SEU COOKIE ---
            // Eu converti o JSON que você mandou para String única.
            const MEU_COOKIE = "__Secure-3PSID=g.a0004ghxM5taiEIwcBf2ptmDT6y5A2mdfnQ8lvrb27EvJ1zuT8qkWSl2fcCjT7s3Up5_lZ5tmQACgYKAXASARMSFQHGX2Mi_hewP5sHSJN1WAXPyWbuORoVAUF8yKoZAd87jk6nV8QXA32OPbxK0076; __Secure-1PSIDTS=sidts-CjIBflaCdWZSzSFzO5owRDcq7X704UmWLoHwPMb9RldNvP0T2sssnQndTiaC28vhkjLmtBAA; SAPISID=VPwIqZNY0IGjoEpy/AsU3cg-Xu4bfgaaxq; __Secure-1PSIDCC=AKEyXzWsugaND5HbSn2CFY_R_xU5CWxPWjJspyT7cN6-RMx8yPGpQpAuMtispI-P5_h4U7W8; SSID=Acn9yEKViChN2BbZd; __Secure-1PAPISID=VPwIqZNY0IGjoEpy/AsU3cg-Xu4bfgaaxq; __Secure-1PSID=g.a0004ghxM5taiEIwcBf2ptmDT6y5A2mdfnQ8lvrb27EvJ1zuT8qkiUItf2DFBAppd_aaR3rY1AACgYKAWISARMSFQHGX2MiTYBu63wR3Yg5a1G8fY7E4xoVAUF8yKoYrUOcUWGdAc6j6i-T64vF0076; __Secure-3PAPISID=VPwIqZNY0IGjoEpy/AsU3cg-Xu4bfgaaxq; __Secure-3PSIDCC=AKEyXzVZJd8hNLR-uTfv5XjvgIb_8w4Ph_peLnEdgibXLumNKJRzdSkvrE_c47EoIs1ccSdu; __Secure-3PSIDTS=sidts-CjIBflaCdWZSzSFzO5owRDcq7X704UmWLoHwPMb9RldNvP0T2sssnQndTiaC28vhkjLmtBAA; LOGIN_INFO=AFmmF2swRQIgAj0pU8MjcdjfbMOhszvEJdf7F-Ektka7ZSQJhu2SpX4CIQDvm_vfchrV7ZHNdOYm8fmM8QOLpvyVMos2BLuVO8IJlw:QUQ3MjNmeGZZRl8yMGd5SkpWY2xsVFMzSGhsTGdJZ0p1cmxFbm5zTmhYTDFSMFdNUkxIa2twdHhzMXhETG51SXd2ZE11Z3JVUTV1dTVqRVgtMEp5QTd1NWliYXJRZTgzY3BhLUdFcnFqU1JfeHMtdm5KNHB3ZDZidnBaeEpabFZEX0I4NWlDWFBaSlRyV2pTR2NPRVQ4QklBTmVYaDRWWndJVjBDdklIdGdpazFkU25DZG11ZlNQNjlGb1N6Y0JQYzJPZHoxeFI3a2hvQXlyTU9vMVRHcUxOSWFNWnd1WjhmUQ==; NID=527=If5M66G2A59C9hjvcR8XCj-ZVlSn7OmcyOT8kMWUGQE73S3ZIX9fL641tNJKdxtFLdvC-R0xBZiw2yF8cRfWLPuPihtuqKwANLAYFH1troJ3X3G5wD6Ptp8MtvGXMBeiApX89kYTidIx3tE6FreZQg_qwD-0puO-kInjuTqfVZFICh-rsoVtCF2_6BY6OunzFcAtZ6WbwJTp39OpWIrQrGvb6rzddIc-P1wYWeeR; PREF=tz=America.Sao_Paulo&f5=20000&f4=10000";

            // Define o cookie e Força o User Agent para parecer um PC real
            await play.setToken({ 
                youtube: { 
                    cookie: MEU_COOKIE
                },
                useragent: ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36']
            });

        } catch (err) {
            console.error('[YouTube Auth] Erro ao aplicar cookies:', err);
        }

        const query = interaction.options.getString('busca');
        let stream;
        let trackInfo;

        try {
            // --- LÓGICA DE BUSCA ---
            if (query.startsWith('http')) {
                // Link
                const type = await play.validate(query); 
                if (type === 'yt_video') {
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
                    // SoundCloud (Sem chave, tenta modo público)
                    const scInfo = await play.soundcloud(query);
                    trackInfo = { title: scInfo.name, url: scInfo.url, duration: 'SoundCloud', thumbnail: scInfo.thumbnail };
                    stream = await play.stream(scInfo.url);
                } 
                else {
                    return interaction.editReply('❌ Link não suportado.');
                }
            } 
            else {
                // Busca Texto
                const results = await play.search(query, { 
                    limit: 1, 
                    source: { youtube: 'video' } 
                });

                if (!results || results.length === 0) return interaction.editReply('❌ Nenhuma música encontrada.');
                
                const video = results[0];
                if (!video || !video.url) return interaction.editReply('❌ Erro na busca (URL undefined). Tente outro termo.');

                trackInfo = {
                    title: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    thumbnail: video.thumbnails[0]?.url
                };

                stream = await play.stream(video.url);
            }

            // --- PLAYER ---
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
                .setTitle('🎶 Tocando Agora')
                .setDescription(`**[${trackInfo.title}](${trackInfo.url})**`)
                .addFields({ name: 'Duração', value: trackInfo.duration || 'Live', inline: true })
                .setThumbnail(trackInfo.thumbnail)
                .setColor('#FF0000');

            await interaction.editReply({ embeds: [embed] });

            player.on('error', error => {
                console.error('Erro no AudioPlayer:', error);
            });

        } catch (error) {
            console.error('Erro Fatal:', error);
            if (error.message.includes('Sign in')) {
                // Se der erro mesmo com o cookie hardcoded, o YouTube invalidou essa sessão específica
                await interaction.editReply('❌ **Login falhou.** O cookie expirou ou o YouTube detectou o IP. Tente pegar um cookie novo na aba anônima.');
            } else {
                await interaction.editReply(`❌ Erro: ${error.message}`);
            }
        }
    }
};