const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const MusicOrchestrator = require('../../utils/MusicOrchestrator.js');
const YouTube = require("youtube-sr").default; // Nossa arma secreta contra bloqueios

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

        let urlToPlay = query;
        let searchResults = [];

        // SE FOR TEXTO (NÃO É LINK), USA O YOUTUBE-SR PARA BUSCAR
        if (!query.startsWith('http')) {
            console.log(`[Play] Buscando externamente: "${query}"`);
            try {
                // Busca 10 vídeos usando a lib externa resistente a bloqueios
                const videos = await YouTube.search(query, { limit: 10, type: 'video' });
                
                if (!videos || videos.length === 0) {
                    throw new Error("Nenhum vídeo encontrado");
                }

                searchResults = videos;
            } catch (err) {
                console.error("[Play] Erro na busca externa:", err.message);
                MusicOrchestrator.releaseWorker(worker.id);
                return interaction.editReply('❌ Não consegui encontrar essa música.');
            }
        } else {
            // Se já for link, trata como resultado único
            urlToPlay = query;
        }

        // --- SE FOR LINK DIRETO (TOCA NA HORA) ---
        if (searchResults.length === 0) {
            const { track } = await worker.player.play(memberChannel, urlToPlay, {
                nodeOptions: { metadata: interaction, leaveOnEmpty: true, leaveOnEnd: true, selfDeaf: true }
            });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setAuthor({ name: `Tocando via ${worker.name}`, iconURL: worker.client.user.displayAvatarURL() })
                .setDescription(`🎵 **[${track.title}](${track.url})**`)
                .addFields({ name: 'Duração', value: track.duration, inline: true });

            await interaction.editReply({ embeds: [embed] });
            setupQueueEvents(worker, interaction.guild.id);
            return;
        }

        // --- SE FOR BUSCA (MOSTRA MENU) ---
        const options = searchResults.map((v, i) => ({
            label: `${i + 1}. ${v.title}`.slice(0, 100),
            description: v.channel ? v.channel.name.slice(0, 100) : 'YouTube',
            value: v.url, // O value é o LINK direto do vídeo
            emoji: '🔴'
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`play_select_${worker.id}`)
            .setPlaceholder('Selecione o vídeo...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`🔎 Resultados para "${query}"`)
            .setDescription(`Encontrei **${searchResults.length}** vídeos.\nSelecione abaixo para tocar.`)
            .setFooter({ text: `Via ${worker.name} • YouTube` });

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error(`[Play] Erro Player:`, error);
        MusicOrchestrator.releaseWorker(worker.id);
        
        if (error.message.includes('Could not load youtube library')) {
             return interaction.editReply('❌ Erro de biblioteca interna. Tente usar um link do Spotify.');
        }
        await interaction.editReply('❌ Erro ao tocar. Tente um link direto.');
    }
};

function setupQueueEvents(worker, guildId) {
    const queue = worker.player.nodes.get(guildId);
    if (queue) {
        queue.once('empty', () => MusicOrchestrator.releaseWorker(worker.id));
        queue.once('disconnect', () => MusicOrchestrator.releaseWorker(worker.id));
    }
}