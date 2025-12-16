const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');

module.exports = {
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // --- SUBCOMANDO: PERFIL ---
        if (subcommand === 'perfil') {
            // Define como ephemeral aqui. Todas as respostas subsequentes (editReply) herdam isso.
            await interaction.deferReply({ ephemeral: true });
            
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("❌ Usuário não encontrado no servidor.");

            try {
                // 1. Buscas paralelas no DB (CORRIGIDO: Removido 'message' da query de logs)
                const [flowRes, pontoRes, socialRes, roleTagsRes, repLogsRes] = await Promise.all([
                    db.query('SELECT balance FROM flow_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT role_id, tag FROM role_tags WHERE guild_id = $1', [interaction.guild.id]),
                    // REMOVIDO 'message' DAQUI POIS A COLUNA NÃO EXISTE NO SEU SCHEMA
                    db.query('SELECT author_id, timestamp FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC', [targetUser.id])
                ]);

                // 2. Prepara dados
                const memberData = {
                    flow: flowRes.rows[0] || { balance: 0 },
                    ponto: pontoRes.rows[0] || { total_ms: 0 },
                    social: socialRes.rows[0] || { reputation: 0, bio: 'Sem bio...', background_url: null },
                    badges: roleTagsRes.rows 
                        .filter(row => targetMember.roles.cache.has(row.role_id))
                        .map(row => ({ icon: '🏅', name: row.tag }))
                };

                // 3. Gera Imagem
                const buffer = await generateProfileCard(targetUser, memberData);
                const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });

                // 4. Botões
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

                // Envia (Sem ephemeral: true aqui, pois já foi definido no deferReply)
                const msg = await interaction.editReply({
                    content: null,
                    files: [attachment],
                    components: [rowMain]
                });

                // 5. Coletor
                const collector = msg.createMessageComponentCollector({ time: 300000 });

                collector.on('collect', async i => {
                    // Botão Elogiar (Lógica simplificada, idealmente mover para handler separado)
                    if (i.customId === 'elogiar') {
                        if (targetUser.id === i.user.id) return i.reply({ content: "❌ Não pode se auto-elogiar.", ephemeral: true });
                        
                        // Verifica cooldown rápido
                        const check = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [i.user.id]);
                        if (check.rows.length && check.rows[0].last_rep_given) {
                            const last = new Date(check.rows[0].last_rep_given);
                            if (new Date() - last < 86400000) return i.reply({ content: "⏳ Você já elogiou hoje.", ephemeral: true });
                        }

                        // Salva
                        await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
                        await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())`, [targetUser.id, i.user.id]);
                        await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = NOW()`, [i.user.id]);

                        await i.reply({ content: `✅ Você elogiou **${targetUser.username}**!`, ephemeral: true });
                        return;
                    }

                    // Navegação
                    if (i.customId === 'ver_elogios' || i.customId === 'voltar_perfil') {
                        if (i.customId === 'voltar_perfil') {
                            await i.update({ 
                                files: [attachment], 
                                embeds: [], 
                                components: [rowMain] 
                            });
                        } else {
                            await handlePagination(i, repLogsRes.rows, targetUser);
                        }
                    }
                });

            } catch (err) {
                console.error(err);
                // Tenta avisar do erro
                if (!interaction.replied) await interaction.editReply("❌ Erro ao gerar perfil.");
            }
        }

        // --- OUTROS SUBCOMANDOS (Bio, Elogiar direto) ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            if (bioText.length > 150) return interaction.reply({ content: "❌ Máximo 150 caracteres.", ephemeral: true });

            await db.query(`INSERT INTO social_users (user_id, bio) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET bio = $2`, [interaction.user.id, bioText]);
            return interaction.reply({ content: `✅ Bio atualizada!\n> "${bioText}"`, ephemeral: true });
        }

        if (subcommand === 'elogiar') {
            // Lógica duplicada do botão, mas para comando direto
            const targetUser = interaction.options.getUser('usuario');
            if (targetUser.id === interaction.user.id) return interaction.reply({ content: "❌ Auto-elogio não vale.", ephemeral: true });
            
            const check = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [interaction.user.id]);
            if (check.rows.length && check.rows[0].last_rep_given) {
                if (new Date() - new Date(check.rows[0].last_rep_given) < 86400000) return interaction.reply({ content: "⏳ Aguarde 24h para elogiar novamente.", ephemeral: true });
            }

            await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
            await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())`, [targetUser.id, interaction.user.id]);
            await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = NOW()`, [interaction.user.id]);

            return interaction.reply({ content: `🌟 Elogio enviado para **${targetUser.username}**!`, ephemeral: true });
        }
    }
};

// --- PAGINAÇÃO ---
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
                // CORRIGIDO: Texto fixo, já que não temos 'log.message'
                return `**<@${log.author_id}>**: "Enviou um Elogio!" \n📅 ${date}\n────────────────`;
            }).join('\n');
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

    const response = await interaction.update({
        files: [],
        embeds: [generateEmbed(page)],
        components: [getButtons(page)],
        fetchReply: true
    });

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
            pagCollector.stop();
        }
    });
}