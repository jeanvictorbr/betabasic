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
                // Removi a busca de saldo (flow_users) pois não vamos usar na imagem, 
                // mas mantive a estrutura caso queira reativar depois.
                const [pontoRes, socialRes, repLogsRes] = await Promise.all([
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    // Pega o último elogio (Limit 1) para mostrar no card
                    db.query('SELECT author_id, timestamp FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 1', [targetUser.id])
                ]);

                // Busca o histórico completo apenas se o usuário clicar no botão "Ver Elogios" depois
                // (Para otimizar, não buscamos tudo agora)

                // 2. Processa o "Último Elogio"
                let lastRepUserObj = null;
                if (repLogsRes.rows.length > 0) {
                    try {
                        const authorUser = await interaction.client.users.fetch(repLogsRes.rows[0].author_id);
                        lastRepUserObj = {
                            user: authorUser,
                            date: repLogsRes.rows[0].timestamp
                        };
                    } catch (e) {
                        // Usuário saiu ou não existe mais
                    }
                }

                // 3. Prepara Dados para o Gerador
                const memberData = {
                    ponto: pontoRes.rows[0] || { total_ms: 0 },
                    social: socialRes.rows[0] || { reputation: 0, bio: 'Sem biografia...', background_url: null },
                    
                    // Dados Visuais Novos
                    joinedAt: targetMember.joinedAt,
                    highestRoleName: targetMember.roles.highest.name,
                    highestRoleColor: targetMember.roles.highest.hexColor,
                    guildIconUrl: interaction.guild.iconURL({ extension: 'png', size: 256 }),
                    
                    // Substituição do Saldo -> Quantidade de Cargos
                    roleCount: targetMember.roles.cache.size - 1, // -1 para tirar o @everyone
                    
                    // Dados do Último Elogio
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
                        .setEmoji('💖') // Emoji fofo no botão também
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

                // 6. Coletor de Botões (Lógica de interação)
                const collector = msg.createMessageComponentCollector({ time: 300000 });

                collector.on('collect', async i => {
                    if (i.customId === 'elogiar') {
                        if (targetUser.id === i.user.id) return i.reply({ content: "❌ Auto-amor é bom, mas aqui não conta rank!", ephemeral: true });
                        
                        // Check Cooldown
                        const check = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [i.user.id]);
                        if (check.rows.length && check.rows[0].last_rep_given) {
                            const last = new Date(check.rows[0].last_rep_given);
                            if (new Date() - last < 86400000) {
                                const nextTime = Math.floor((last.getTime() + 86400000) / 1000);
                                return i.reply({ content: `⏳ Volte <t:${nextTime}:R> para elogiar novamente.`, ephemeral: true });
                            }
                        }

                        await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
                        await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())`, [targetUser.id, i.user.id]);
                        await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = NOW()`, [i.user.id]);

                        await i.reply({ content: `💖 Você enviou um elogio para **${targetUser.username}**!`, ephemeral: true });
                    }

                    if (i.customId === 'ver_elogios' || i.customId === 'voltar_perfil') {
                        if (i.customId === 'voltar_perfil') {
                            await i.update({ files: [attachment], embeds: [], components: [rowMain] });
                        } else {
                            // Busca logs completos para paginação
                            const fullLogs = await db.query('SELECT author_id, timestamp FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 50', [targetUser.id]);
                            await handlePagination(i, fullLogs.rows, targetUser);
                        }
                    }
                });

            } catch (err) {
                console.error(err);
                if (!interaction.replied) await interaction.editReply("❌ Erro ao gerar perfil.");
            }
        }

        // --- SUBCOMANDO: BIO ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            if (bioText.length > 150) return interaction.reply({ content: "❌ A bio deve ter no máximo 150 caracteres.", ephemeral: true });

            await db.query(`INSERT INTO social_users (user_id, bio) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET bio = $2`, [interaction.user.id, bioText]);
            return interaction.reply({ content: `✅ Bio atualizada!\n> "${bioText}"`, ephemeral: true });
        }

        // --- SUBCOMANDO: ELOGIAR (Direto) ---
        if (subcommand === 'elogiar') {
            const targetUser = interaction.options.getUser('usuario');
            if (targetUser.id === interaction.user.id) return interaction.reply({ content: "❌ Você não pode se elogiar.", ephemeral: true });
            
            const check = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [interaction.user.id]);
            if (check.rows.length && check.rows[0].last_rep_given) {
                const diff = new Date() - new Date(check.rows[0].last_rep_given);
                if (diff < 86400000) return interaction.reply({ content: "⏳ Você já usou seu elogio diário.", ephemeral: true });
            }

            await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
            await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())`, [targetUser.id, interaction.user.id]);
            await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = NOW()`, [interaction.user.id]);

            return interaction.reply({ content: `🌟 Elogio enviado para **${targetUser.username}**!`, ephemeral: true });
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
                return `💖 De <@${log.author_id}> em \`${date}\``;
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
            // O update de voltar é tratado no coletor principal do execute
        }
    });
}