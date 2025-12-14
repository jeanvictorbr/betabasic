const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');
const axios = require('axios'); // REQUER: npm install axios

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música via Túnel Cobalt (Bypass IP Ban)',
        options: [
            {
                name: 'busca',
                type: 3,
                description: 'Nome da música ou Link (YouTube/SoundCloud)',
                required: true
            }
        ]
    },
    async execute(interaction) {
        await interaction.deferReply();
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.editReply('❌ Entre em um canal de voz.');

        const query = interaction.options.getString('busca');
        let targetUrl = query;
        let trackTitle = 'Música Desconhecida';
        let trackThumb = null;

        try {
            // --- PASSO 1: RESOLVER O LINK (Se for texto, tenta achar o link no YT) ---
            // A pesquisa do YT costuma funcionar mesmo com IP sujo (o que falha é o download)
            if (!query.startsWith('http')) {
                try {
                    const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
                    if (results.length > 0) {
                        targetUrl = results[0].url;
                        trackTitle = results[0].title;
                        trackThumb = results[0].thumbnails[0]?.url;
                    } else {
                        return interaction.editReply('❌ Não encontrei essa música na pesquisa.');
                    }
                } catch (searchErr) {
                    console.log('Pesquisa YT falhou, pedindo link direto...');
                    return interaction.editReply('❌ A pesquisa por nome falhou (bloqueio do Google). Por favor, use o **LINK** direto do YouTube ou SoundCloud.');
                }
            }

            // --- PASSO 2: O TÚNEL (COBALT API) ---
            // Mandamos o link para o Cobalt. Ele baixa e nos devolve o link do áudio.
            // Isso evita o erro 403/Sign-in, pois é o Cobalt que acessa o YouTube.
            
            const cobaltResponse = await axios.post('https://api.cobalt.tools/api/json', {
                url: targetUrl,
                isAudioOnly: true, // Queremos só áudio
                aFormat: 'mp3'
            }, {
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                }
            });

            const data = cobaltResponse.data;

            if (!data || !data.url) {
                console.error('Erro Cobalt:', data);
                return interaction.editReply('❌ O Túnel não conseguiu processar esse link. Tente outro.');
            }

            const streamUrl = data.url; // Link direto do MP3

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
                .setTitle('🎶 Tocando via Túnel')
                .setDescription(`**[${trackTitle !== 'Música Desconhecida' ? trackTitle : 'Link Original'}](${targetUrl})**`)
                .setFooter({ text: 'Sistema Cobalt Bypass (Anti-Block)' })
                .setColor('Green');

            if (trackThumb) embed.setThumbnail(trackThumb);

            await interaction.editReply({ embeds: [embed] });

            player.on('error', error => {
                console.error('Erro Player:', error);
                if(!interaction.replied) interaction.followUp({content: 'Erro na reprodução.', ephemeral:true});
            });

        } catch (error) {
            console.error('Erro Fatal:', error.message);
            await interaction.editReply('❌ Erro crítico. Se você digitou o nome, tente mandar o **LINK** direto.');
        }
    }
};