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

        // Se o usuário mandar link do YouTube, avisamos que não suportamos (para evitar crashes)
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            MusicOrchestrator.releaseWorker(worker.id);
            return interaction.editReply('❌ **YouTube indisponível** devido a bloqueios de região.\n✅ Por favor, pesquise o **Nome da Música** (buscarei no SoundCloud) ou use link do SoundCloud.');
        }

        // --- BUSCA NO SOUNDCLOUD ---
        // Se for link direto (http), usa AUTO. Se for texto, força SOUNDCLOUD_SEARCH.
        const searchEngine = query.startsWith('http') ? QueryType.AUTO : QueryType.SOUNDCLOUD_SEARCH;

        const searchResult = await worker.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: searchEngine
        });

        if (!searchResult || !searchResult.tracks.length) {
            MusicOrchestrator.releaseWorker(worker.id);
            return interaction.editReply('❌ Nenhuma música encontrada no SoundCloud.');
        }

        // --- TOCAR DIRETO (Link ou Resultado Único) ---
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
                .setColor('#FF5500') // Laranja SoundCloud
                .setAuthor({ name: `Tocando via ${worker.name}`, iconURL: worker.client.user.displayAvatarURL() })
                .setDescription(`🎵 **[${track.title}](${track.url})**\n*Artista: ${track.author}*`)
                .setFooter({ text: 'Fonte: SoundCloud' });

            await interaction.editReply({ embeds: [embed] });
            setupQueueEvents(worker, interaction.guild.id);
            return;
        }

        // --- MENU DE SELEÇÃO (Para Pesquisa por Nome) ---
        const tracks = searchResult.tracks.slice(0, 10);
        
        const options = tracks.map((track, i) => ({
            label: `${i + 1}. ${track.title}`.slice(0, 100),
            description: track.author.slice(0, 100),
            value: track.url, 
            emoji: '🟠' // Emoji SoundCloud
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`play_select_${worker.id}`)
            .setPlaceholder('Selecione a música...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#FF5500')
            .setTitle('🔎 Resultados SoundCloud')
            .setDescription(`Encontrei **${tracks.length}** resultados para \`${query}\`.`)
            .setFooter({ text: `Worker: ${worker.name}` });

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error(`[Play] Erro:`, error);
        MusicOrchestrator.releaseWorker(worker.id);
        await interaction.editReply('❌ Erro ao buscar. Tente pesquisar pelo nome exato.');
    }
};

function setupQueueEvents(worker, guildId) {
    const queue = worker.player.nodes.get(guildId);
    if (queue) {
        queue.once('empty', () => MusicOrchestrator.releaseWorker(worker.id));
        queue.once('disconnect', () => MusicOrchestrator.releaseWorker(worker.id));
    }
}