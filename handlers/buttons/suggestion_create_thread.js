// handlers/buttons/suggestion_create_thread.js
const { ChannelType, MessageFlags } = require('discord.js');
const db = require('../../database.js'); // Importação direta

module.exports = {
    customId: 'suggestion_create_thread',
    execute: async (interaction, client) => {
        try {
            const message = interaction.message;
            
            if (message.hasThread) {
                return interaction.reply({ 
                    content: '❌ Já existe uma discussão criada para esta sugestão.', 
                    flags: MessageFlags.Ephemeral 
                });
            }

            const suggestionEmbed = message.embeds[0];
            const title = suggestionEmbed && suggestionEmbed.title ? suggestionEmbed.title : 'Sugestão';

            const thread = await message.startThread({
                name: `💬 Discussão: ${title.slice(0, 50)}`,
                autoArchiveDuration: 1440,
                type: ChannelType.PublicThread,
                reason: `Discussão iniciada por ${interaction.user.tag}`
            });

            // Permissões
            await thread.permissionOverwrites.create(interaction.guild.roles.everyone, {
                SendMessages: true,
                ViewChannel: true
            });

            await thread.members.add(interaction.user.id);

            await interaction.reply({ 
                content: `✅ Discussão criada com sucesso! [Clique aqui](${thread.url})`, 
                flags: MessageFlags.Ephemeral 
            });

        } catch (error) {
            console.error('Erro thread:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ Erro ao criar discussão.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};