// handlers/buttons/suggestion_create_thread.js
const { ChannelType } = require('discord.js');

module.exports = {
    customId: 'suggestion_create_thread',
    execute: async (client, interaction, db) => {
        try {
            const message = interaction.message;
            
            // Verifica se já existe um tópico (thread) nessa mensagem
            if (message.hasThread) {
                return interaction.reply({ content: '❌ Já existe uma discussão criada para esta sugestão.', ephemeral: true });
            }

            // Tenta pegar o título do embed original para usar no nome do tópico
            const suggestionEmbed = message.embeds[0];
            const title = suggestionEmbed && suggestionEmbed.title ? suggestionEmbed.title : 'Sugestão';

            // Cria o Tópico (Thread)
            const thread = await message.startThread({
                name: `💬 Discussão: ${title.slice(0, 50)}`, // Limita o tamanho do nome para evitar erros
                autoArchiveDuration: 1440, // 24 horas de inatividade para arquivar
                type: ChannelType.PublicThread,
                reason: `Discussão iniciada por ${interaction.user.tag}`
            });

            // --- CORREÇÃO DE PERMISSÕES ---
            // Força a permissão para @everyone poder enviar mensagens dentro do tópico
            // Isso resolve o problema de "ninguém consegue comentar"
            await thread.permissionOverwrites.create(interaction.guild.roles.everyone, {
                SendMessages: true,
                ViewChannel: true
            });

            // Adiciona o usuário que clicou no botão ao tópico
            await thread.members.add(interaction.user.id);

            await interaction.reply({ 
                content: `✅ Discussão criada com sucesso! Todos podem comentar agora.\n🔗 [Clique aqui para ir ao tópico](${thread.url})`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro ao criar thread de sugestão:', error);
            // Mensagem de erro genérica para o usuário não ficar sem resposta
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ Ocorreu um erro ao tentar criar a discussão. Verifique se eu tenho permissão de "Criar Tópicos Públicos" e "Gerenciar Tópicos".', ephemeral: true });
            }
        }
    }
};