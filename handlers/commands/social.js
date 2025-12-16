const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');

module.exports = {
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'perfil') {
            await interaction.deferReply({ ephemeral: true });
            
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("❌ Usuário não encontrado.");

            try {
                // 1. Busca Dados
                const [flowRes, pontoRes, socialRes, roleTagsRes, repLogsRes] = await Promise.all([
                    db.query('SELECT balance FROM flow_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT role_id, tag FROM role_tags WHERE guild_id = $1', [interaction.guild.id]),
                    db.query('SELECT author_id, timestamp, message FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC', [targetUser.id])
                ]);

                // 2. Prepara Objeto de Dados para o Gerador
                const memberData = {
                    flow: flowRes.rows[0] || { balance: 0 },
                    ponto: pontoRes.rows[0] || { total_ms: 0 }, // Passando ms puros, o gerador formata
                    social: socialRes.rows[0] || { reputation: 0, bio: 'Sem bio...', background_url: null },
                    badges: roleTagsRes.rows // Badges baseadas em cargos
                        .filter(row => targetMember.roles.cache.has(row.role_id))
                        .map(row => ({ icon: '🏅', name: row.tag })) // Mapeie ícone se tiver coluna emoji no banco
                };

                // 3. Gera a Imagem do Card
                const buffer = await generateProfileCard(targetUser, memberData);
                const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });

                // 4. Botões Iniciais (Perfil)
                const rowMain = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('elogiar')
                        .setLabel('Elogiar (+1 Rep)')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(targetUser.id === interaction.user.id),
                    new ButtonBuilder()
                        .setCustomId('ver_elogios')
                        .setLabel('Ver Elogios')
                        .setEmoji('📜')
                        .setStyle(ButtonStyle.Primary)
                );

                // Envia a resposta inicial
                const msg = await interaction.editReply({
                    content: null,
                    files: [attachment],
                    components: [rowMain]
                });

                // 5. Coletor de Interação para Botões e Paginação
                const collector = msg.createMessageComponentCollector({ time: 300000 }); // 5 minutos

                collector.on('collect', async i => {
                    // Botão Elogiar
                    if (i.customId === 'elogiar') {
                        // Lógica rápida de elogio (simplificada aqui)
                        // ... insira a validação de cooldown e update no DB aqui ou chame função externa ...
                        await i.reply({ content: `✅ Você elogiou ${targetUser.username}!`, ephemeral: true });
                        return;
                    }

                    // Botão Ver Elogios (Inicia Paginação)
                    if (i.customId === 'ver_elogios' || i.customId === 'voltar_perfil') {
                        if (i.customId === 'voltar_perfil') {
                            // VOLTAR PARA O CARD
                            await i.update({ 
                                content: null, 
                                files: [attachment], // Reusa a imagem gerada
                                embeds: [], 
                                components: [rowMain] 
                            });
                        } else {
                            // MOSTRAR LISTA DE ELOGIOS (Paginada)
                            await handlePagination(i, repLogsRes.rows, targetUser);
                        }
                    }
                });

            } catch (err) {
                console.error(err);
                interaction.editReply("❌ Erro ao gerar perfil.");
            }
        }
        
        // ... Logica dos outros subcomandos (bio, elogiar direto) ...
    }
};

// --- FUNÇÃO AUXILIAR DE PAGINAÇÃO ---
async function handlePagination(interaction, logs, targetUser) {
    const ITEMS_PER_PAGE = 5;
    let page = 0;
    const maxPages = Math.ceil(logs.length / ITEMS_PER_PAGE) || 1;

    const generateEmbed = (currentPage) => {
        const start = currentPage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const slicedLogs = logs.slice(start, end);

        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`📜 Histórico de Elogios: ${targetUser.username}`)
            .setFooter({ text: `Página ${currentPage + 1} de ${maxPages} • Total: ${logs.length}` });

        if (slicedLogs.length === 0) {
            embed.setDescription("*Nenhum elogio recebido ainda.*");
        } else {
            const description = slicedLogs.map(log => {
                const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
                return `**<@${log.author_id}>**: "Recebeu +1 Rep" \n📅 ${date}\n────────────────`;
            }).join('\n');
            embed.setDescription(description);
        }
        return embed;
    };

    const getButtons = (currPage) => {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('voltar_perfil').setLabel('Voltar ao Perfil').setStyle(ButtonStyle.Secondary).setEmoji('↩️'),
            new ButtonBuilder().setCustomId('pag_prev').setLabel('Anterior').setStyle(ButtonStyle.Primary).setDisabled(currPage === 0),
            new ButtonBuilder().setCustomId('pag_next').setLabel('Próximo').setStyle(ButtonStyle.Primary).setDisabled(currPage >= maxPages - 1)
        );
        return row;
    };

    // Atualiza a mensagem para mostrar o Embed
    const response = await interaction.update({
        files: [], // Remove a imagem do perfil
        embeds: [generateEmbed(page)],
        components: [getButtons(page)],
        fetchReply: true
    });

    // Cria um coletor específico para a paginação nessa mensagem
    const pagCollector = response.createMessageComponentCollector({ time: 60000 });

    pagCollector.on('collect', async subI => {
        if (subI.user.id !== interaction.user.id) return subI.reply({ content: 'Use seu próprio comando!', ephemeral: true });

        if (subI.customId === 'pag_prev') {
            page--;
            await subI.update({ embeds: [generateEmbed(page)], components: [getButtons(page)] });
        } else if (subI.customId === 'pag_next') {
            page++;
            await subI.update({ embeds: [generateEmbed(page)], components: [getButtons(page)] });
        } else if (subI.customId === 'voltar_perfil') {
            pagCollector.stop(); // Para este coletor pois o coletor principal vai lidar com "voltar_perfil"
            // Não fazemos update aqui porque o listener principal 'ver_elogios'/'voltar_perfil' lá em cima cuidará de restaurar a imagem
        }
    });
}