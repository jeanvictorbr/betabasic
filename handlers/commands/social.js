const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');

module.exports = {
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // --- SUBCOMANDO: PERFIL ---
        if (subcommand === 'perfil') {
            await interaction.deferReply({ ephemeral: true });
            
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("❌ Usuário não encontrado no servidor.");

            try {
                // 1. Buscas no Banco de Dados
                const [pontoRes, socialRes, repLogsRes] = await Promise.all([
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    // TENTA buscar a mensagem. Se der erro de coluna não existente, vai cair no catch
                    db.query('SELECT author_id, timestamp, message FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 1', [targetUser.id])
                ]);

                // 2. Processa o "Último Elogio"
                let lastRepUserObj = null;
                if (repLogsRes.rows.length > 0) {
                    try {
                        const authorUser = await interaction.client.users.fetch(repLogsRes.rows[0].author_id);
                        lastRepUserObj = {
                            user: authorUser,
                            date: repLogsRes.rows[0].timestamp,
                            message: repLogsRes.rows[0].message // Passa a mensagem para o gerador
                        };
                    } catch (e) {}
                }

                // 3. Prepara Dados para o Gerador
                const memberData = {
                    ponto: pontoRes.rows[0] || { total_ms: 0 },
                    social: socialRes.rows[0] || { reputation: 0, bio: 'Sem biografia...', background_url: null },
                    
                    joinedAt: targetMember.joinedAt,
                    highestRoleName: targetMember.roles.highest.name,
                    highestRoleColor: targetMember.roles.highest.hexColor,
                    guildIconUrl: interaction.guild.iconURL({ extension: 'png', size: 256 }),
                    roleCount: targetMember.roles.cache.size - 1,
                    
                    lastRepUser: lastRepUserObj
                };

                // 4. Gera a Imagem
                const buffer = await generateProfileCard(targetUser, memberData);
                const attachment = new AttachmentBuilder(buffer, { name: 'social-card.png' });

                // 5. Botões
                const rowMain = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('elogiar')
                        .setLabel('Elogiar (+1 Rep)')
                        .setEmoji('💖')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(targetUser.id === interaction.user.id),
                    new ButtonBuilder()
                        .setCustomId('ver_elogios')
                        .setLabel('Histórico')
                        .setEmoji('📜')
                        .setStyle(ButtonStyle.Secondary)
                );

                const msg = await interaction.editReply({
                    content: null,
                    files: [attachment],
                    components: [rowMain]
                });

                // 6. Coletor
                const collector = msg.createMessageComponentCollector({ time: 300000 });

                collector.on('collect', async i => {
                    if (i.customId === 'elogiar') {
                        if (targetUser.id === i.user.id) return i.reply({ content: "❌ Amor próprio é tudo, mas aqui não conta!", ephemeral: true });
                        
                        try {
                            // Salva elogio padrão (via botão não tem como escrever mensagem ainda)
                            await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
                            // Mensagem padrão para clique no botão
                            const defaultMsg = "Gostei do seu perfil! (Botão)";
                            await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp, message) VALUES ($1, $2, NOW(), $3)`, [targetUser.id, i.user.id, defaultMsg]);
                            await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = NOW()`, [i.user.id]);

                            await i.reply({ content: `💖 Elogio enviado para **${targetUser.username}**!`, ephemeral: true });
                        } catch (err) {
                            console.error(err);
                            await i.reply({ content: "❌ Erro. (Verifique se a coluna 'message' existe na tabela social_rep_logs)", ephemeral: true });
                        }
                    }

                    if (i.customId === 'ver_elogios' || i.customId === 'voltar_perfil') {
                        if (i.customId === 'voltar_perfil') {
                            await i.update({ files: [attachment], embeds: [], components: [rowMain] });
                        } else {
                            // Busca histórico com mensagens
                            const fullLogs = await db.query('SELECT author_id, timestamp, message FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 50', [targetUser.id]);
                            await handlePagination(i, fullLogs.rows, targetUser);
                        }
                    }
                });

            } catch (err) {
                console.error(err);
                if (!interaction.replied) await interaction.editReply("❌ Erro ao gerar perfil. Verifique se o banco de dados tem a coluna 'message'.");
            }
        }

        // --- SUBCOMANDO: BIO ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            if (bioText.length > 150) return interaction.reply({ content: "❌ Máximo 150 caracteres.", ephemeral: true });

            await db.query(`INSERT INTO social_users (user_id, bio) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET bio = $2`, [interaction.user.id, bioText]);
            return interaction.reply({ content: `✅ Bio atualizada!\n> "${bioText}"`, ephemeral: true });
        }

        // --- SUBCOMANDO: ELOGIAR (Direto) ---
        if (subcommand === 'elogiar') {
            const targetUser = interaction.options.getUser('usuario');
            // Tenta pegar a mensagem opcional do comando. Se não tiver, usa padrão.
            const message = interaction.options.getString('mensagem') || interaction.options.getString('motivo') || "Um elogio para você!"; 

            if (targetUser.id === interaction.user.id) return interaction.reply({ content: "❌ Você não pode se elogiar.", ephemeral: true });
            
            try {
                await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
                
                // INSERT COM MENSAGEM
                await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp, message) VALUES ($1, $2, NOW(), $3)`, [targetUser.id, interaction.user.id, message]);
                
                await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = NOW()`, [interaction.user.id]);

                return interaction.reply({ content: `🌟 Elogio enviado para **${targetUser.username}**!\n> *"${message}"*`, ephemeral: true });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "❌ Erro ao salvar. Verifique se a coluna 'message' existe no banco.", ephemeral: true });
            }
        }
    }
};

// --- FUNÇÃO DE PAGINAÇÃO ---
async function handlePagination(interaction, logs, targetUser) {
    const ITEMS_PER_PAGE = 5;
    let page = 0;
    const maxPages = Math.ceil(logs.length / ITEMS_PER_PAGE) || 1;

    const generateEmbed = (currentPage) => {
        const start = currentPage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const slicedLogs = logs.slice(start, end);

        const embed = new EmbedBuilder()
            .setColor('#ff6b81')
            .setTitle(`📜 Histórico de Elogios: ${targetUser.username}`)
            .setFooter({ text: `Página ${currentPage + 1}/${maxPages} • Total: ${logs.length}` });

        if (slicedLogs.length === 0) {
            embed.setDescription("*Nenhum elogio recebido ainda.*");
        } else {
            const description = slicedLogs.map(log => {
                const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
                const msg = log.message ? `"${log.message}"` : '"Sem mensagem"';
                return `💖 De <@${log.author_id}> em \`${date}\`\n💬 ${msg}`;
            }).join('\n────────────────\n');
            embed.setDescription(description);
        }
        return embed;
    };

    const getButtons = (currPage) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('voltar_perfil').setLabel('Voltar ao Perfil').setStyle(ButtonStyle.Secondary).setEmoji('↩️'),
            new ButtonBuilder().setCustomId('pag_prev').setLabel('Anterior').setStyle(ButtonStyle.Primary).setDisabled(currPage === 0),
            new ButtonBuilder().setCustomId('pag_next').setLabel('Próximo').setStyle(ButtonStyle.Primary).setDisabled(currPage >= maxPages - 1)
        );
    };

    const msg = await interaction.update({
        files: [],
        embeds: [generateEmbed(page)],
        components: [getButtons(page)],
        fetchReply: true
    });

    const pagCollector = msg.createMessageComponentCollector({ time: 60000 });

    pagCollector.on('collect', async subI => {
        if (subI.user.id !== interaction.user.id) return subI.reply({ content: 'Use seu próprio comando!', ephemeral: true });

        if (subI.customId === 'pag_prev') {
            page--;
            await subI.update({ embeds: [generateEmbed(page)], components: [getButtons(page)] });
        } else if (subI.customId === 'pag_next') {
            page++;
            await subI.update({ embeds: [generateEmbed(page)], components: [getButtons(page)] });
        } else if (subI.customId === 'voltar_perfil') {
            pagCollector.stop();
        }
    });
}