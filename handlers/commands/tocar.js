const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música (Sistema Híbrido: Pesquisa YT -> Áudio SC)',
        options: [
            {
                name: 'busca',
                type: 3,
                description: 'Nome da música',
                required: true
            }
        ]
    },
    async execute(interaction) {
        await interaction.deferReply();

        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.editReply('❌ Entre em um canal de voz.');

        // Tenta configurar o Client ID do SoundCloud se tiver no .env
        // Se não tiver, ele tenta gerar um automático (pode funcionar ou não, mas é melhor que o YT agora)
        if (process.env.SOUNDCLOUD_CLIENT_ID) {
            await play.setToken({ soundcloud: { client_id: process.env.SOUNDCLOUD_CLIENT_ID } });
        } else {
            await play.getFreeClientID().then((clientID) => {
                play.setToken({ soundcloud: { client_id: clientID } });
            }).catch(() => console.log('⚠️ Falha ao gerar ID automático SoundCloud.'));
        }

        const query = interaction.options.getString('busca');
        let trackInfo;
        let stream;

        try {
            // PASSO 1: PESQUISAR (Usamos YouTube porque a pesquisa é melhor)
            // Se for link, detectamos o que é. Se for texto, buscamos no YouTube.
            
            let searchTerm = query;
            let thumbnail = '';
            let title = '';
            let duration = '';
            let url = '';

            // Se for Link do YouTube, pegamos apenas o TÍTULO para buscar no SoundCloud
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                if (play.yt_validate(query) === 'video') {
                     // Tenta pegar info básica sem baixar (menos chance de block)
                     const ytData = await play.video_info(query).catch(() => null);
                     if (ytData) {
                         searchTerm = ytData.video_details.title;
                         thumbnail = ytData.video_details.thumbnails[0].url;
                         title = ytData.video_details.title;
                         duration = ytData.video_details.durationRaw;
                         url = query;
                     }
                }
            }

            // PASSO 2: ENCONTRAR O ÁUDIO NO SOUNDCLOUD (Bypass de Bloqueio)
            // Pesquisa no SoundCloud usando o nome que achamos no YouTube ou o texto digitado
            const scResults = await play.search(searchTerm, {
                limit: 1,
                source: { soundcloud: 'tracks' }
            });

            if (!scResults || scResults.length === 0) {
                return interaction.editReply('❌ Não encontrei uma versão de áudio acessível para esta música.');
            }

            const scTrack = scResults[0];

            // Se não pegamos os dados do YouTube antes, usamos os do SoundCloud
            if (!title) {
                title = scTrack.name;
                thumbnail = scTrack.thumbnail;
                duration = 'SoundCloud';
                url = scTrack.url;
            }

            // PASSO 3: TOCAR (Do SoundCloud)
            stream = await play.stream(scTrack.url);

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
                .setDescription(`**[${title}](${url})**`)
                .setFooter({ text: 'Fonte de Áudio: SoundCloud (Mirror)' })
                .setThumbnail(thumbnail)
                .setColor('Orange');

            if (duration) embed.addFields({ name: 'Duração', value: duration, inline: true });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro: ' + error.message);
        }
    }
};