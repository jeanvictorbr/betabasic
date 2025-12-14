const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const axios = require('axios');
const yts = require('yt-search'); // REQUER: npm install yt-search

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música via Túnel Wuk (Bypass Avançado)',
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

        const query = interaction.options.getString('busca');
        let videoUrl = query;
        let videoTitle = 'Música';
        let videoThumb = null;

        try {
            // --- PASSO 1: ACHAR O LINK (Usando yt-search) ---
            // Se não for link, pesquisamos.
            if (!query.startsWith('http')) {
                const searchResult = await yts(query);
                
                if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
                    return interaction.editReply('❌ Não encontrei nada com esse nome.');
                }

                const video = searchResult.videos[0];
                videoUrl = video.url;
                videoTitle = video.title;
                videoThumb = video.thumbnail;
            }

            // --- PASSO 2: O TÚNEL (Mirror wuk.sh) ---
            // Usamos um servidor alternativo do Cobalt que costuma aceitar mais conexões
            
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            };

            const body = {
                url: videoUrl,
                isAudioOnly: true,
                aFormat: 'mp3'
            };

            // Tenta primeiro no mirror wuk.sh (Geralmente mais estável para bots)
            let streamUrl = null;
            
            try {
                const response = await axios.post('https://co.wuk.sh/api/json', body, { headers });
                if (response.data && response.data.url) {
                    streamUrl = response.data.url;
                }
            } catch (err1) {
                console.log('Mirror 1 falhou, tentando oficial...', err1.message);
                // Se falhar, tenta o oficial
                try {
                    const response2 = await axios.post('https://api.cobalt.tools/api/json', body, { headers });
                    if (response2.data && response2.data.url) {
                        streamUrl = response2.data.url;
                    }
                } catch (err2) {
                    throw new Error(`API Recusou: ${err2.response?.status || 'Erro Conexão'}`);
                }
            }

            if (!streamUrl) {
                return interaction.editReply('❌ Erro 400/403: O servidor de áudio recusou processar esse link específico.');
            }

            // --- PASSO 3: TOCAR ---
            const resource = createAudioResource(streamUrl);
            
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
                .setDescription(`**[${videoTitle}](${videoUrl})**`)
                .setFooter({ text: 'Sistema: Wuk.sh Tunnel' })
                .setColor('Purple');

            if (videoThumb) embed.setThumbnail(videoThumb);

            await interaction.editReply({ embeds: [embed] });

            player.on('error', error => {
                console.error('Erro Player:', error);
            });

        } catch (error) {
            console.error('Erro Fatal:', error);
            await interaction.editReply(`❌ Erro: ${error.message}. Tente usar um link direto do YouTube.`);
        }
    }
};