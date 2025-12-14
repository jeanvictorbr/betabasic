const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');
const db = require('../../database.js');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música do YouTube',
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
        if (!channel) return interaction.editReply('❌ Você precisa estar em um canal de voz.');

        // --- 1. CONFIGURAÇÃO DOS COOKIES (ANTIBLOQUEIO) ---
        try {
            let ytCookie = process.env.YOUTUBE_COOKIES;

            // Se não tiver no .env, tenta buscar do banco de dados (salvo pelo /setup-youtube)
            if (!ytCookie) {
                const res = await db.query("SELECT maintenance_message FROM bot_status WHERE status_key = 'youtube_config'");
                if (res.rows.length > 0) {
                    ytCookie = res.rows[0].maintenance_message;
                    process.env.YOUTUBE_COOKIES = ytCookie; // Cache na memória
                }
            }

            if (ytCookie) {
                await play.setToken({ youtube: { cookie: ytCookie } });
            }
        } catch (err) {
            console.error('[YouTube Auth] Erro ao carregar cookies:', err);
        }

        const query = interaction.options.getString('busca');
        let stream;
        let trackInfo;

        try {
            // --- 2. LÓGICA DE BUSCA E STREAM ---
            
            // CASO 1: É um LINK
            if (query.startsWith('http')) {
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
                    // Fallback para SoundCloud se for link explícito
                    const scInfo = await play.soundcloud(query);
                    trackInfo = { 
                        title: scInfo.name, 
                        url: scInfo.url, 
                        duration: 'SoundCloud', 
                        thumbnail: scInfo.thumbnail 
                    };
                    stream = await play.stream(scInfo.url);
                } 
                else {
                    return interaction.editReply('❌ Link não suportado. Use links do YouTube ou SoundCloud.');
                }
            } 
            // CASO 2: É UMA BUSCA (TEXTO)
            else {
                // Força a busca no YouTube
                const results = await play.search(query, { 
                    limit: 1, 
                    source: { youtube: 'video' } 
                });

                if (!results || results.length === 0) {
                    return interaction.editReply('❌ Nenhuma música encontrada com esse nome.');
                }

                const video = results[0];

                // Verificação de Segurança (Corrige o erro 'undefined')
                if (!video || !video.url) {
                    console.error('Resultado da busca inválido:', video);
                    return interaction.editReply('❌ Erro ao obter link do vídeo. Tente ser mais específico.');
                }

                trackInfo = {
                    title: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    thumbnail: video.thumbnails[0]?.url
                };

                // Cria o stream usando a URL garantida
                stream = await play.stream(video.url);
            }

            // --- 3. REPRODUÇÃO ---
            const resource = createAudioResource(stream.stream, { inputType: stream.type });
            
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
                .addFields({ name: 'Duração', value: trackInfo.duration || 'Live', inline: true })
                .setThumbnail(trackInfo.thumbnail || null)
                .setColor('#FF0000') // Vermelho YouTube
                .setFooter({ text: 'Sistema de Música BasicFlow' });

            await interaction.editReply({ embeds: [embed] });

            // Tratamento de erros do Player
            player.on('error', error => {
                console.error('Erro no AudioPlayer:', error);
            });

        } catch (error) {
            console.error('Erro Fatal no Comando Tocar:', error);
            
            let msg = '❌ Ocorreu um erro ao tentar tocar a música.';
            
            if (error.message.includes('Sign in') || error.message.includes('429')) {
                msg = '⚠️ **Bloqueio do YouTube:** O bot precisa de Cookies atualizados. Use `/setup-youtube` com o arquivo JSON.';
            } else if (error.code === 'ERR_INVALID_URL') {
                msg = '❌ Erro de URL inválida. O YouTube pode ter alterado algo, tente outro termo de busca.';
            }

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(msg);
            } else {
                await interaction.reply({ content: msg, ephemeral: true });
            }
        }
    }
};