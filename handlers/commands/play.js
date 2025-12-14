const { EmbedBuilder } = require('discord.js');
const MusicOrchestrator = require('../../utils/MusicOrchestrator.js');

module.exports = async (interaction) => {
    // 1. Verificações Básicas
    const memberChannel = interaction.member.voice.channel;
    if (!memberChannel) {
        return interaction.reply({ content: '❌ Você precisa estar em um canal de voz!', ephemeral: true });
    }

    // Defer para dar tempo de processar
    await interaction.deferReply();

    const query = interaction.options.getString('busca');

    // 2. Pedir um Worker Livre para o Orquestrador
    const worker = MusicOrchestrator.getFreeWorker(interaction.guild.id);

    if (!worker) {
        return interaction.editReply('⚠️ **Todos os bots de música estão ocupados no momento!** Tente novamente mais tarde.');
    }

    try {
        // 3. Fazer o Worker entrar no canal de voz (usando o Shoukaku dele)
        // O player é criado na conexão do worker, mas na guild do usuário
        const player = await worker.shoukaku.joinVoiceChannel({
            guildId: interaction.guild.id,
            channelId: memberChannel.id,
            shardId: 0 // Geralmente 0 para bots pequenos/únicos
        });

        // 4. Buscar a música no Lavalink
        const searchResult = await player.node.rest.resolve(query);

        if (!searchResult || searchResult.loadType === 'NO_MATCHES') {
            player.destroy(); // Sai do canal se não achar nada
            return interaction.editReply('❌ Nenhuma música encontrada.');
        }

        if (searchResult.loadType === 'LOAD_FAILED') {
            player.destroy();
            return interaction.editReply('❌ Erro ao carregar a música no Lavalink.');
        }

        // Pega a primeira faixa (ou playlist, se quiser implementar depois)
        const track = searchResult.tracks.shift();

        // 5. Tocar!
        await player.playTrack({ track: track.track });
        
        // Define o estado do worker
        worker.currentGuild = interaction.guild.id;
        worker.busy = true;

        // Evento para limpar quando a música acabar
        player.once('end', () => {
            worker.busy = false;
            worker.currentGuild = null;
            // Opcional: player.destroy() se quiser que ele saia assim que acabar
        });

        // 6. Feedback Visual V2
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: `Tocando via ${worker.name}`, iconURL: worker.client.user.displayAvatarURL() })
            .setDescription(`🎵 **[${track.info.title}](${track.info.uri})**`)
            .addFields(
                { name: 'Duração', value: formatTime(track.info.length), inline: true },
                { name: 'Canal', value: `<#${memberChannel.id}>`, inline: true }
            )
            .setFooter({ text: `Pedido por ${interaction.user.tag}` });

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error(`[Play] Erro ao usar worker ${worker.name}:`, error);
        worker.busy = false; // Libera o worker em caso de erro
        await interaction.editReply('❌ Ocorreu um erro ao tentar conectar o bot de música.');
    }
};

// Função auxiliar simples para tempo
function formatTime(ms) {
    const min = Math.floor(ms / 60000);
    const sec = ((ms % 60000) / 1000).toFixed(0);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}