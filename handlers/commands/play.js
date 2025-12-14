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

        // Se for Link do YouTube, avisamos que não suportamos (pois removemos a lib para evitar erros)
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            MusicOrchestrator.releaseWorker(worker.id);
            return interaction.editReply('❌ **Links do YouTube estão desativados** para estabilidade.\n✅ Use **Links do Spotify**, **SoundCloud** ou pesquise pelo **Nome da música**.');
        }

        // Busca sempre no Spotify (Melhor qualidade de metadados)
        // Se for link http (Spotify/SoundCloud), usa AUTO.
        const searchEngine = query.startsWith('http') ? QueryType.AUTO : QueryType.SPOTIFY_SEARCH;

        const searchResult = await worker.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: searchEngine
        });

        if (!searchResult || !searchResult.tracks.length) {
            MusicOrchestrator.releaseWorker(worker.id);
            return interaction.editReply('❌ Nenhuma música encontrada.');
        }

        // Tocar Direto (Links ou Resultado único)
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
                .setColor('#1DB954')
                .setAuthor({ name: `Tocando via ${worker.name}`, iconURL: worker.client.user.displayAvatarURL() })
                .setDescription(`🎵 **[${track.title}](${track.url})**\n*Artista: ${track.author}*`)
                .setFooter({ text: 'Fonte: Spotify • Áudio: SoundCloud' });

            await interaction.editReply({ embeds: [embed] });
            setupQueueEvents(worker, interaction.guild.id);
            return;
        }

        // Menu de Seleção
        const tracks = searchResult.tracks.slice(0, 10);
        const options = tracks.map((track, i) => ({
            label: `${i + 1}. ${track.title}`.slice(0, 100),
            description: track.author.slice(0, 100),
            value: track.url, 
            emoji: '🟢'
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`play_select_${worker.id}`)
            .setPlaceholder('Selecione a música do Spotify...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🔎 Resultados do Spotify')
            .setDescription(`Encontrei **${tracks.length}** resultados para \`${query}\`.`)
            .setFooter({ text: `Via ${worker.name}` });

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