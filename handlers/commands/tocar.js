// handlers/commands/tocar.js
const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');

// --- CONFIGURAÇÃO SEGURA ---
// Se você conseguiu o ID no passo anterior, coloque aqui entre aspas. Ex: 'SEU_ID_AQUI'
// Se deixar vazio, ele tenta pegar sozinho (pode falhar na host).
const MANUAL_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID || 'SWyL8lfXvb4KLlnYZhWM5kqACdr55cNp'; 

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

        // --- INICIALIZAÇÃO SOB DEMANDA (Evita crash no boot) ---
        try {
            const currentID = await play.getFreeClientID().catch(() => null);
            const tokenToUse = MANUAL_CLIENT_ID || currentID;

            if (!tokenToUse) {
                return interaction.editReply('⚠️ **Erro de Conexão com SoundCloud**\nA hospedagem do bot está bloqueada pelo SoundCloud (Erro 403) e não consegui gerar uma chave de acesso.\n\n**Solução:** O dono do bot precisa adicionar `SOUNDCLOUD_CLIENT_ID` no arquivo `.env`.');
            }

            await play.setToken({
                soundcloud: {
                    client_id: tokenToUse
                }
            });
        } catch (error) {
            console.error("Erro ao configurar SoundCloud:", error);
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
                    return interaction.editReply('❌ Apenas links de **músicas** do SoundCloud são suportados (Playlists em breve).');
                }
            } else {
                const results = await play.search(query, {
                    source: { soundcloud: 'tracks' },
                    limit: 1
                });

                if (results.length === 0) {
                    return interaction.editReply('❌ Nenhuma música encontrada no SoundCloud.');
                }
                trackInfo = results[0];
            }

            // --- 2. SISTEMA DE PLAYER ---
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const stream = await play.stream(trackInfo.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            const player = createAudioPlayer({
                behaviors: { noSubscriber: NoSubscriberBehavior.Play }
            });

            player.play(resource);
            connection.subscribe(player);

            // --- 3. RESPOSTA VISUAL ---
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

        } catch (error) {
            console.error('Erro no comando tocar:', error);
            await interaction.editReply('❌ Erro ao reproduzir. Se for um erro de "403 Forbidden", configure o Client ID no `.env`.');
        }
    }
};