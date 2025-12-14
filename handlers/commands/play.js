const { EmbedBuilder } = require('discord.js');
const MusicOrchestrator = require('../../utils/MusicOrchestrator.js');
const { useMainPlayer } = require('discord-player');

module.exports = async (interaction) => {
    const memberChannel = interaction.member.voice.channel;
    if (!memberChannel) {
        return interaction.reply({ content: '❌ Entre em um canal de voz primeiro!', ephemeral: true });
    }

    await interaction.deferReply();
    const query = interaction.options.getString('busca');

    // 1. Pega um Worker
    const worker = MusicOrchestrator.getFreeWorker(interaction.guild.id);

    if (!worker) {
        return interaction.editReply('⚠️ **Todos os bots de música estão ocupados!**');
    }

    try {
        // Marca como ocupado
        worker.busy = true;
        worker.currentGuild = interaction.guild.id;

        // 2. Tocar usando o Player do Worker
        // O método 'play' do discord-player resolve a busca e entra no canal
        const { track } = await worker.player.play(memberChannel, query, {
            nodeOptions: {
                metadata: interaction, // Salva a interação para usar depois
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
                { name: 'Autor', value: track.author, inline: true }
            )
            .setFooter({ text: `Pedido por ${interaction.user.username}` });

        await interaction.editReply({ embeds: [embed] });

        // Handler para quando a música acabar (para liberar o worker no sistema)
        // Precisamos pegar a fila criada
        const queue = worker.player.nodes.get(interaction.guild.id);
        if (queue) {
            queue.once('empty', () => {
                MusicOrchestrator.releaseWorker(worker.id);
            });
            queue.once('disconnect', () => {
                MusicOrchestrator.releaseWorker(worker.id);
            });
        }

    } catch (error) {
        console.error(`[Play] Erro com worker ${worker.name}:`, error);
        MusicOrchestrator.releaseWorker(worker.id); // Libera em caso de erro
        
        // Verifica se o erro foi "não encontrado"
        if (error.message.includes('ERR_NO_RESULT')) {
            return interaction.editReply('❌ Música não encontrada.');
        }
        await interaction.editReply('❌ Ocorreu um erro ao processar a música.');
    }
};