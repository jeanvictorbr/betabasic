const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música via Deezer (Bypass de Bloqueio)',
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

        const query = interaction.options.getString('busca');
        let stream;
        let trackInfo;

        try {
            // --- ESTRATÉGIA DEEZER (Menos bloqueios) ---
            
            if (query.startsWith('http')) {
                // Se for link, verificamos se é Deezer
                if (query.includes('deezer.com')) {
                    const dzType = await play.validate(query);
                    if (dzType === 'dz_track') {
                        const dzInfo = await play.deezer(query);
                        trackInfo = {
                            title: dzInfo.title,
                            url: dzInfo.url,
                            duration: dzInfo.durationInSec ? `${Math.floor(dzInfo.durationInSec/60)}:${(dzInfo.durationInSec%60).toString().padStart(2,'0')}` : '??:??',
                            thumbnail: dzInfo.picture?.medium
                        };
                        stream = await play.stream(dzInfo.url);
                    } else {
                        return interaction.editReply('❌ Apenas links do Deezer são garantidos nessa hospedagem.');
                    }
                } else {
                    // Tenta YouTube se for link, mas avisa se der erro
                    try {
                        const ytInfo = await play.video_info(query);
                        trackInfo = { title: ytInfo.video_details.title, url: ytInfo.video_details.url, duration: 'YouTube', thumbnail: ytInfo.video_details.thumbnails[0].url };
                        stream = await play.stream(query);
                    } catch (e) {
                        return interaction.editReply('❌ Link do YouTube bloqueado pela hospedagem. Tente buscar pelo NOME (usarei Deezer).');
                    }
                }
            } else {
                // BUSCA POR NOME -> VAI DIRETO NA DEEZER
                const results = await play.search(query, { 
                    limit: 1, 
                    source: { deezer: 'track' } // <--- O PULO DO GATO
                });

                if (!results || results.length === 0) {
                    return interaction.editReply('❌ Não achei essa música na Deezer.');
                }

                const track = results[0];
                trackInfo = {
                    title: track.title,
                    url: track.url,
                    duration: track.durationInSec ? `${Math.floor(track.durationInSec/60)}:${(track.durationInSec%60).toString().padStart(2,'0')}` : '??:??',
                    thumbnail: track.picture?.medium || track.artist?.picture?.medium
                };

                // Stream direto da Deezer
                stream = await play.stream(track.url);
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
                .setFooter({ text: 'Fonte: Deezer (Anti-Block)' })
                .setThumbnail(trackInfo.thumbnail)
                .setColor('#00C7F2'); // Azul Deezer

            if (trackInfo.duration) embed.addFields({ name: 'Duração', value: trackInfo.duration, inline: true });

            await interaction.editReply({ embeds: [embed] });

            player.on('error', error => {
                console.error('Erro Player:', error);
                if(!interaction.replied) interaction.followUp({content: 'Erro na reprodução', ephemeral:true});
            });

        } catch (error) {
            console.error('Erro Deezer:', error);
            await interaction.editReply('❌ Erro: Até a Deezer bloqueou ou a música não foi encontrada. Tente rodar o bot no seu PC.');
        }
    }
};