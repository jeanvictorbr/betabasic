// handlers/buttons/suggestion_create_thread.js
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, interaction, db) => {
    try {
        const message = interaction.message;
        
        // Verifica se já existe um tópico
        if (message.hasThread) {
            return interaction.reply({ content: '❌ Já existe uma discussão para esta sugestão.', ephemeral: true });
        }

        // Recupera o embed para pegar o título ou autor
        const suggestionEmbed = message.embeds[0];
        const title = suggestionEmbed.title || 'Sugestão';

        // Cria o tópico
        const thread = await message.startThread({
            name: `💬 Discussão: ${title.slice(0, 50)}`, // Limita tamanho do nome
            autoArchiveDuration: 1440, // 24 horas
            type: ChannelType.PublicThread,
            reason: `Discussão criada por ${interaction.user.tag}`
        });

        // IMPORTANTE: Adiciona permissão para @everyone digitar NO TÓPICO
        // Isso sobrepõe a restrição do canal pai
        await thread.permissionOverwrites.create(interaction.guild.roles.everyone, {
            SendMessages: true,
            ViewChannel: true
        });

        // Adiciona o usuário que clicou no botão
        await thread.members.add(interaction.user.id);

        await interaction.reply({ content: `✅ Discussão criada com sucesso! [Clique aqui para ir](${thread.url})`, ephemeral: true });

    } catch (error) {
        console.error('Erro ao criar thread:', error);
        interaction.reply({ content: '❌ Ocorreu um erro ao criar a discussão.', ephemeral: true });
    }
};