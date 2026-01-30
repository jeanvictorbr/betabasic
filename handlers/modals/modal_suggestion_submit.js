// handlers/modals/modal_suggestion_submit.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    customId: 'modal_suggestion_submit',
    execute: async (interaction, client) => {
        // 1. Pegar os dados do formulário
        const titulo = interaction.fields.getTextInputValue('suggestion_title');
        const conteudo = interaction.fields.getTextInputValue('suggestion_content');

        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // 2. Buscar configurações do servidor
            const query = 'SELECT * FROM guild_settings WHERE guild_id = $1';
            const result = await db.query(query, [interaction.guild.id]);
            
            // Se não tiver configuração, usa um objeto vazio
            const settings = result.rows[0] || {};
            
            // Verifica se o canal está configurado
            const channelId = settings.suggestions_channel;
            if (!channelId) {
                return interaction.editReply({ content: '❌ O canal de sugestões não está configurado neste servidor.' });
            }

            const channel = interaction.guild.channels.cache.get(channelId);
            if (!channel) {
                return interaction.editReply({ content: '❌ Não encontrei o canal de sugestões configurado.' });
            }

            // 3. Montar o Embed da Sugestão
            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: `Sugestão de ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTitle(titulo)
                .setDescription(conteudo)
                .setColor('#F1C40F') // Amarelo (Pendente)
                .addFields(
                    { name: 'Status', value: '⏳ Pendente', inline: true },
                    { name: 'Votos', value: '👍 0 | 👎 0', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `ID do Usuário: ${interaction.user.id}` });

            // --- AQUI ESTÁ A CORREÇÃO QUE VOCÊ PEDIU ---
            // Se tiver uma imagem configurada na vitrine, usa ela também na sugestão
            if (settings.suggestions_vitrine_image) {
                embed.setImage(settings.suggestions_vitrine_image);
            }
            // -------------------------------------------

            // 4. Criar Botões de Votação e Moderação
            const rowUser = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('suggestion_upvote').setEmoji('👍').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('suggestion_downvote').setEmoji('👎').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('suggestion_create_thread').setLabel('Discutir').setEmoji('💬').setStyle(ButtonStyle.Primary)
                );

            // Botões administrativos (aparecem para todos, mas só staff usa)
            const rowAdmin = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('suggestion_approve').setLabel('Aprovar').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('suggestion_deny').setLabel('Reprovar').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('suggestion_delete').setLabel('Deletar').setStyle(ButtonStyle.Secondary).setEmoji('🗑️')
                );

            // 5. Enviar a mensagem no canal
            const message = await channel.send({ 
                content: settings.suggestions_mention_everyone ? '@everyone Nova sugestão!' : null,
                embeds: [embed], 
                components: [rowUser, rowAdmin] 
            });

            // 6. Salvar no Banco de Dados (Tabela de histórico de sugestões)
            // Certifique-se de que a tabela 'suggestions' existe no seu schema
            await db.query(`
                INSERT INTO suggestions (guild_id, user_id, message_id, title, description, status, created_at)
                VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
            `, [interaction.guild.id, interaction.user.id, message.id, titulo, conteudo]);

            // 7. Confirmação final para o usuário
            await interaction.editReply({ 
                content: `✅ Sua sugestão foi enviada com sucesso em ${channel}!` 
            });

        } catch (error) {
            console.error('Erro ao enviar sugestão:', error);
            // Tenta avisar o usuário se der erro
            try {
                if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ Ocorreu um erro ao processar sua sugestão.' });
                } else {
                    await interaction.reply({ content: '❌ Ocorreu um erro ao processar sua sugestão.', flags: MessageFlags.Ephemeral });
                }
            } catch (e) { }
        }
    }
};