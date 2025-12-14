const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const MusicOrchestrator = require('../../utils/MusicOrchestrator.js');
const { QueryType } = require('discord-player');

module.exports = async (interaction) => {
    const memberChannel = interaction.member.voice.channel;
    if (!memberChannel) {
        return interaction.reply({ content: '❌ Entre em um canal de voz primeiro!', ephemeral: true });
    }

    await interaction.deferReply();
    const query = interaction.options.getString('busca');

    const worker = MusicOrchestrator.getFreeWorker(interaction.guild.id);
    if (!worker) {
        return interaction.editReply('⚠️ **Todos os bots de música estão ocupados!** Tente novamente mais tarde.');
    }

    try {
        worker.currentGuild = interaction.guild.id; 
        worker.busy = true;

        // --- MUDANÇA DE ESTRATÉGIA: SPOTIFY PRIMEIRO ---
        // Se for um link (http), usa AUTO. Se for texto, força SPOTIFY.
        const searchEngine = query.startsWith('http') ? QueryType.AUTO : QueryType.SPOTIFY_SEARCH;

        const searchResult = await worker.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: searchEngine
        });

        if (!searchResult || !searchResult.tracks.length) {
            MusicOrchestrator.releaseWorker(worker.id);
            return interaction.editReply('❌ Nenhuma música encontrada (Tentei no Spotify e YouTube).');
        }

        // Se for link direto ou Playlist, toca direto
        if (searchResult.tracks.length === 1 || query.startsWith('http')) {
            const { track } = await worker.player.play(memberChannel, searchResult, {
                nodeOptions: {
                    metadata: interaction,
                    leaveOnEmpty: true,
                    leaveOnEnd: true,
                    selfDeaf: true
                }
            });

            const embed = new EmbedBuilder()
                .setColor('#1DB954') // Cor do Spotify
                .setAuthor({ name: `Tocando via ${worker.name}`, iconURL: worker.client.user.displayAvatarURL() })
                .setDescription(`🎵 **[${track.title}](${track.url})**\n*Fonte: ${track.source}*`)
                .addFields(
                    { name: 'Duração', value: track.duration, inline: true },
                    { name: 'Artista', value: track.author, inline: true }
                );

            await interaction.editReply({ embeds: [embed] });
            setupQueueEvents(worker, interaction.guild.id);
            return;
        }

        // --- MENU DE SELEÇÃO (SPOTIFY) ---
        const tracks = searchResult.tracks.slice(0, 10);
        
        const options = tracks.map((track, i) => ({
            label: `${i + 1}. ${track.title}`.slice(0, 100),
            description: track.author.slice(0, 100),
            value: track.url, 
            emoji: '🟢' // Emoji verde pra indicar Spotify
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`play_select_${worker.id}`)
            .setPlaceholder('Selecione a música do Spotify...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🔎 Resultados do Spotify')
            .setDescription(`Encontrei **${tracks.length}** resultados para \`${query}\`.\nO áudio será processado automaticamente.`)
            .setFooter({ text: `Worker: ${worker.name}` });

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error(`[Play] Erro:`, error);
        MusicOrchestrator.releaseWorker(worker.id);
        await interaction.editReply('❌ Erro ao buscar. Tente novamente.');
    }
};

function setupQueueEvents(worker, guildId) {
    const queue = worker.player.nodes.get(guildId);
    if (queue) {
        queue.once('empty', () => MusicOrchestrator.releaseWorker(worker.id));
        queue.once('disconnect', () => MusicOrchestrator.releaseWorker(worker.id));
    }
}