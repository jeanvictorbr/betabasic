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

    // 1. Pega um Worker Livre
    const worker = MusicOrchestrator.getFreeWorker(interaction.guild.id);
    if (!worker) {
        return interaction.editReply('⚠️ **Todos os bots de música estão ocupados!** Tente novamente mais tarde.');
    }

    try {
        // Marca o worker como ocupado temporariamente para a busca
        worker.currentGuild = interaction.guild.id; 
        worker.busy = true;

        // 2. Realiza a Pesquisa
        const searchResult = await worker.player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.AUTO
        });

        if (!searchResult || !searchResult.tracks.length) {
            MusicOrchestrator.releaseWorker(worker.id);
            return interaction.editReply('❌ Nenhuma música encontrada com esse nome.');
        }

        // --- MODO 1: É UM LINK OU RESULTADO ÚNICO (Toca direto) ---
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
                .setDescription(`🎵 **${track.title}**`)
                .addFields(
                    { name: 'Duração', value: track.duration, inline: true },
                    { name: 'Canal', value: `<#${memberChannel.id}>`, inline: true }
                );

            await interaction.editReply({ embeds: [embed] });
            setupQueueEvents(worker, interaction.guild.id);
            return;
        }

        // --- MODO 2: É UMA PESQUISA (Mostra Menu) ---
        
        // Pega as 10 primeiras músicas
        const tracks = searchResult.tracks.slice(0, 10);
        
        const options = tracks.map((track, i) => ({
            label: `${i + 1}. ${track.title}`.slice(0, 100),
            description: track.author.slice(0, 100),
            value: track.url, // O valor é o link da música
            emoji: '🎵'
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`play_select_${worker.id}`) // Passa o ID do worker que vai tocar
            .setPlaceholder('Selecione a música para tocar...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🔎 Resultados da Pesquisa')
            .setDescription(`Encontrei **${tracks.length}** resultados para \`${query}\`.\nSelecione abaixo qual deseja ouvir.`)
            .setFooter({ text: `Via ${worker.name}` });

        await interaction.editReply({ embeds: [embed], components: [row] });

        // Nota: O worker continua ocupado esperando a seleção no próximo arquivo handler

    } catch (error) {
        console.error(`[Play] Erro:`, error);
        MusicOrchestrator.releaseWorker(worker.id);
        await interaction.editReply('❌ Erro ao buscar a música. Tente novamente.');
    }
};

function setupQueueEvents(worker, guildId) {
    const queue = worker.player.nodes.get(guildId);
    if (queue) {
        queue.once('empty', () => MusicOrchestrator.releaseWorker(worker.id));
        queue.once('disconnect', () => MusicOrchestrator.releaseWorker(worker.id));
    }
}