const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');
const db = require('../../database.js');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música do YouTube (Use /setup-youtube antes)',
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
        if (!channel) return interaction.editReply('❌ Entre em um canal de voz.');

        try {
            // --- RECUPERAÇÃO AUTOMÁTICA DE CREDENCIAIS ---
            let ytCookie = process.env.YOUTUBE_COOKIES;

            // Se não tiver no .env, busca no Banco de Dados (onde o /setup-youtube salvou)
            if (!ytCookie) {
                const res = await db.query("SELECT maintenance_message FROM bot_status WHERE status_key = 'youtube_config'");
                if (res.rows.length > 0) {
                    ytCookie = res.rows[0].maintenance_message;
                    // Salva no process.env para as próximas vezes serem mais rápidas
                    process.env.YOUTUBE_COOKIES = ytCookie;
                }
            }

            // Aplica o cookie no play-dl
            if (ytCookie) {
                await play.setToken({ youtube: { cookie: ytCookie } });
            }
            // ---------------------------------------------

            const query = interaction.options.getString('busca');
            let stream;
            let trackInfo;

            // Busca (YouTube por padrão)
            if (query.startsWith('http')) {
                const type = await play.validate(query); 
                if (type === 'yt_video') {
                    const ytInfo = await play.video_info(query);
                    trackInfo = {
                        title: ytInfo.video_details.title,
                        url: ytInfo.video_details.url,
                        duration: ytInfo.video_details.durationRaw,
                        thumbnail: ytInfo.video_details.thumbnails[0].url
                    };
                    stream = await play.stream(query);
                } else {
                    // Tenta SoundCloud como fallback
                    try {
                       const scInfo = await play.soundcloud(query);
                       trackInfo = { title: scInfo.name, url: scInfo.url, duration: 'SoundCloud', thumbnail: scInfo.thumbnail };
                       stream = await play.stream(scInfo.url);
                    } catch(e) {
                       return interaction.editReply('❌ Link inválido ou não suportado (apenas YouTube/SoundCloud).');
                    }
                }
            } else {
                const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
                if (results.length === 0) return interaction.editReply('❌ Nada encontrado.');
                
                const ytVideo = results[0];
                trackInfo = {
                    title: ytVideo.title,
                    url: ytVideo.url,
                    duration: ytVideo.durationRaw,
                    thumbnail: ytVideo.thumbnails[0].url
                };
                stream = await play.stream(ytVideo.url);
            }

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
                .setThumbnail(trackInfo.thumbnail)
                .setColor('#FF0000');

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro no player:', error);
            if (error.message.includes('Sign in') || error.message.includes('429')) {
                await interaction.editReply('⚠️ **YouTube Bloqueado!**\nUse o comando `/setup-youtube [colar]` com os dados da extensão Cookie-Editor para desbloquear.');
            } else {
                await interaction.editReply('❌ Erro ao tocar. Tente outro link.');
            }
        }
    }
};