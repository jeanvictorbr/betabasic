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

        // 1. TENTATIVA PRINCIPAL: Spotify (Melhor qualidade de dados)
        let searchEngine = query.startsWith('http') ? QueryType.AUTO : QueryType.SPOTIFY_SEARCH;
        
        let searchResult = await worker.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: searchEngine
        }).catch(() => null);

        // 2. FALLBACK (PLANO B): Se Spotify falhar ou vier vazio, tenta SoundCloud
        if (!searchResult || !searchResult.tracks.length) {
            console.log(`[Play] Busca Spotify vazia para "${query}". Tentando SoundCloud...`);
            
            // Se for link, não tem fallback (link é específico). Se for texto, tenta SC.
            if (!query.startsWith('http')) {
                searchResult = await worker.player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.SOUNDCLOUD_SEARCH
                }).catch(() => null);
            }
        }

        // Se falhar nos dois
        if (!searchResult || !searchResult.tracks.length) {
            MusicOrchestrator.releaseWorker(worker.id);
            return interaction.editReply('❌ **Não encontrei nada.**\nTentei no Spotify e no SoundCloud e ambos falharam. Tente usar um link direto.');
        }

        // --- TOCAR DIRETO (Links ou Resultado Único) ---
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
                .setColor('#5865F2')
                .setAuthor({ name: `Tocando via ${worker.name}`, iconURL: worker.client.user.displayAvatarURL() })
                .setDescription(`🎵 **[${track.title}](${track.url})**\n*Artista: ${track.author}*`)
                .setFooter({ text: `Fonte: ${track.source}` }); // Mostra de onde veio (Spotify/SoundCloud)

            await interaction.editReply({ embeds: [embed] });
            setupQueueEvents(worker, interaction.guild.id);
            return;
        }

        // --- MOSTRAR MENU DE SELEÇÃO ---
        // Pega os 10 primeiros resultados (seja do Spotify ou SoundCloud)
        const tracks = searchResult.tracks.slice(0, 10);
        
        const options = tracks.map((track, i) => ({
            label: `${i + 1}. ${track.title}`.slice(0, 100),
            description: track.author ? track.author.slice(0, 100) : 'Desconhecido',
            value: track.url, 
            emoji: track.source === 'spotify' ? '🟢' : '🟠' // Verde (Spotify) ou Laranja (SoundCloud)
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`play_select_${worker.id}`)
            .setPlaceholder('Selecione a música para tocar...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`🔎 Resultados da Busca (${searchResult.tracks[0].source})`)
            .setDescription(`Encontrei **${tracks.length}** resultados para \`${query}\`.\nSelecione abaixo para tocar.`)
            .setFooter({ text: `Worker: ${worker.name}` });

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error(`[Play] Erro Crítico:`, error);
        MusicOrchestrator.releaseWorker(worker.id);
        await interaction.editReply('❌ Ocorreu um erro interno ao tentar processar a música.');
    }
};

function setupQueueEvents(worker, guildId) {
    const queue = worker.player.nodes.get(guildId);
    if (queue) {
        queue.once('empty', () => MusicOrchestrator.releaseWorker(worker.id));
        queue.once('disconnect', () => MusicOrchestrator.releaseWorker(worker.id));
    }
}