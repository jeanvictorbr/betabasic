// handlers/buttons/suggestion_create_thread.js
const { ChannelType } = require('discord.js');

module.exports = {
    customId: 'suggestion_create_thread',
    // CORREÇÃO: Ordem dos parâmetros
    execute: async (interaction, client, db) => {
        // Fallback de segurança
        const i = interaction.reply ? interaction : client;

        try {
            const message = i.message;
            
            if (message.hasThread) {
                return i.reply({ content: '❌ Já existe uma discussão criada para esta sugestão.', ephemeral: true });
            }

            const suggestionEmbed = message.embeds[0];
            const title = suggestionEmbed && suggestionEmbed.title ? suggestionEmbed.title : 'Sugestão';

            const thread = await message.startThread({
                name: `💬 Discussão: ${title.slice(0, 50)}`,
                autoArchiveDuration: 1440,
                type: ChannelType.PublicThread,
                reason: `Discussão iniciada por ${i.user.tag}`
            });

            await thread.permissionOverwrites.create(i.guild.roles.everyone, {
                SendMessages: true,
                ViewChannel: true
            });

            await thread.members.add(i.user.id);

            await i.reply({ 
                content: `✅ Discussão criada com sucesso! [Clique aqui](${thread.url})`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro thread:', error);
            if (!i.replied) await i.reply({ content: '❌ Erro ao criar discussão.', ephemeral: true });
        }
    }
};