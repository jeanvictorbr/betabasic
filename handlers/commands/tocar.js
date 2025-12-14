const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: {
        name: 'tocar',
        description: 'Toca música do SoundCloud',
        options: [
            {
                name: 'busca',
                type: 3, // STRING
                description: 'Nome da música ou Link do SoundCloud',
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

        // --- CORREÇÃO CRÍTICA DO ERRO 403 ---
        const manualId = process.env.SOUNDCLOUD_CLIENT_ID;

        try {
            if (manualId) {
                // Se tem ID no .env, define DIRETO e não tenta buscar nada na rede
                await play.setToken({
                    soundcloud: {
                        client_id: manualId
                    }
                });
            } else {
                // Só tenta o método automático (que dá erro 403) se NÃO tiver ID no .env
                console.log('⚠️ [SoundCloud] Tentando gerar ClientID automático (Risco de 403)...');
                const freeId = await play.getFreeClientID();
                await play.setToken({
                    soundcloud: {
                        client_id: freeId
                    }
                });
            }
        } catch (error) {
            console.error('Erro na configuração do SoundCloud:', error);
            // Não retorna, tenta continuar mesmo assim, caso a lib tenha cache
        }

        const query = interaction.options.getString('busca');
        let trackInfo;

        try {
            // --- 1. LÓGICA DE BUSCA ---
            if (query.startsWith('http')) {
                const type = await play.validate(query); 
                if (type === 'so_track') {
                    trackInfo = await play.soundcloud(query);
                } else {
                    return interaction.editReply('❌ Apenas links de **músicas** do SoundCloud são suportados.');
                }
            } else {
                // Busca por texto
                const results = await play.search(query, {
                    source: { soundcloud: 'tracks' },
                    limit: 1
                });

                if (results.length === 0) {
                    return interaction.editReply('❌ Nenhuma música encontrada no SoundCloud.');
                }
                trackInfo = results[0];
            }

            // --- 2. STREAM DO ÁUDIO ---
            const stream = await play.stream(trackInfo.url);
            
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

            // --- 3. RESPOSTA ---
            const embed = new EmbedBuilder()
                .setTitle('🎶 Tocando Agora')
                .setDescription(`**[${trackInfo.name}](${trackInfo.url})**`)
                .addFields(
                    { name: 'Duração', value: trackInfo.durationInSec ? `${Math.floor(trackInfo.durationInSec / 60)}:${(trackInfo.durationInSec % 60).toString().padStart(2, '0')}` : 'Live', inline: true },
                    { name: 'Artista', value: trackInfo.user?.name || 'Desconhecido', inline: true }
                )
                .setThumbnail(trackInfo.thumbnail)
                .setColor('#ff5500');

            await interaction.editReply({ embeds: [embed] });

            player.on('error', error => {
                console.error('Erro no player:', error);
                if (!interaction.replied) interaction.followUp({ content: '❌ Erro na reprodução.', ephemeral: true });
            });

        } catch (error) {
            console.error('Erro de execução:', error);
            // Verifica se o erro ainda é 403 mesmo com a chave
            if (error.message && error.message.includes('403')) {
                await interaction.editReply('❌ **Erro 403 (Acesso Negado):** O Client ID no `.env` é inválido ou expirou. Por favor, gere um novo no site do SoundCloud.');
            } else {
                await interaction.editReply('❌ Erro ao tentar tocar. Verifique logs.');
            }
        }
    }
};