const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const axios = require('axios'); // REQUER: npm install axios
const play = require('play-dl');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música via Túnel Wuk (Versão Leve)',
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
            // --- PASSO 1: ACHAR O LINK (Usando play-dl que você já tem) ---
            if (!query.startsWith('http')) {
                // Pesquisa no YouTube usando play-dl (apenas metadados, costuma funcionar)
                const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
                
                if (!results || results.length === 0) {
                    return interaction.editReply('❌ Não encontrei nada com esse nome.');
                }
                
                const video = results[0];
                videoUrl = video.url;
                videoTitle = video.title;
                videoThumb = video.thumbnails[0]?.url;
            }

            // --- PASSO 2: O TÚNEL (Mirror wuk.sh) ---
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            };

            const body = {
                url: videoUrl,
                isAudioOnly: true,
                aFormat: 'mp3'
            };

            let streamUrl = null;
            
            // Tenta mirror wuk.sh
            try {
                const response = await axios.post('https://co.wuk.sh/api/json', body, { headers });
                if (response.data && response.data.url) streamUrl = response.data.url;
            } catch (err) {
                console.log('Mirror falhou:', err.message);
            }
            
            // Se falhar, tenta cobalt oficial
            if (!streamUrl) {
                try {
                     const response2 = await axios.post('https://api.cobalt.tools/api/json', body, { headers });
                     if (response2.data && response2.data.url) streamUrl = response2.data.url;
                } catch (err) {}
            }

            if (!streamUrl) {
                return interaction.editReply('❌ Erro: O servidor de áudio (Cobalt) recusou o link. Tente outro.');
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
                .setFooter({ text: 'Sistema: Cobalt Bypass' })
                .setColor('Purple');

            if (videoThumb) embed.setThumbnail(videoThumb);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro Fatal:', error);
            await interaction.editReply(`❌ Erro: ${error.message}`);
        }
    }
};