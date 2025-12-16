const { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');

module.exports = {
    // --- 1. CONFIGURAÇÃO (Sem a opção mensagem, pois será via Modal) ---
    data: new SlashCommandBuilder()
        .setName('social')
        .setDescription('Sistema social completo')
        .addSubcommand(sub => 
            sub.setName('perfil')
                .setDescription('Vê o cartão de perfil')
                .addUserOption(opt => opt.setName('usuario').setDescription('De quem?')))
        .addSubcommand(sub => 
            sub.setName('bio')
                .setDescription('Define sua bio')
                .addStringOption(opt => opt.setName('texto').setDescription('Sua bio').setRequired(true).setMaxLength(150)))
        .addSubcommand(sub => 
            sub.setName('elogiar')
                .setDescription('Abre um formulário para elogiar alguém')
                .addUserOption(opt => opt.setName('usuario').setDescription('Quem merece?').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // --- SUBCOMANDO: PERFIL ---
        if (subcommand === 'perfil') {
            await interaction.deferReply({ ephemeral: true });
            
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("❌ Usuário não encontrado.");

            try {
                // Buscas DB
                const [pontoRes, socialRes, repLogsRes] = await Promise.all([
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    // Tenta buscar msg, se falhar (catch no profile generator resolve)
                    db.query('SELECT author_id, timestamp, message FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 1', [targetUser.id])
                ]);

                // Processa último elogio
                let lastRepUserObj = null;
                if (repLogsRes.rows.length > 0) {
                    try {
                        const authorUser = await interaction.client.users.fetch(repLogsRes.rows[0].author_id);
                        lastRepUserObj = {
                            user: authorUser,
                            date: repLogsRes.rows[0].timestamp,
                            message: repLogsRes.rows[0].message
                        };
                    } catch (e) {}
                }

                // Dados
                const memberData = {
                    ponto: pontoRes.rows[0] || { total_ms: 0 },
                    social: socialRes.rows[0] || { reputation: 0, bio: 'Sem bio...', background_url: null },
                    joinedAt: targetMember.joinedAt,
                    highestRoleName: targetMember.roles.highest.name,
                    highestRoleColor: targetMember.roles.highest.hexColor,
                    guildIconUrl: interaction.guild.iconURL({ extension: 'png', size: 256 }),
                    roleCount: targetMember.roles.cache.size - 1,
                    lastRepUser: lastRepUserObj
                };

                const buffer = await generateProfileCard(targetUser, memberData);
                const attachment = new AttachmentBuilder(buffer, { name: 'social-card.png' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('elogiar').setLabel('Elogiar (+1 Rep)').setEmoji('💖').setStyle(ButtonStyle.Success).setDisabled(targetUser.id === interaction.user.id),
                    new ButtonBuilder().setCustomId('ver_elogios').setLabel('Histórico').setEmoji('📜').setStyle(ButtonStyle.Secondary)
                );

                const msg = await interaction.editReply({ files: [attachment], components: [row] });
                
                // Coletor de botões (Mantido igual)
                const collector = msg.createMessageComponentCollector({ time: 300000 });
                collector.on('collect', async i => {
                     // ... (Mesma lógica de botões que já tínhamos) ...
                     // OBS: O botão 'elogiar' aqui ainda vai fazer o elogio direto (sem modal)
                     // Se quiser mudar o botão para abrir modal também, me avise, é mais complexo.
                     if (i.customId === 'elogiar') {
                        if (targetUser.id === i.user.id) return i.reply({ content: "❌ Sem auto-elogio!", ephemeral: true });
                        // Salva elogio rápido (Botão)
                        await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
                        await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp, message) VALUES ($1, $2, NOW(), $3)`, [targetUser.id, i.user.id, "Gostei do perfil! (Botão)"]);
                        await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, NOW()) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = NOW()`, [i.user.id]);
                        await i.reply({ content: `💖 Elogiado!`, ephemeral: true });
                     }
                     // ... resto da navegação ...
                     if (i.customId === 'ver_elogios' || i.customId === 'voltar_perfil') {
                        if (i.customId === 'voltar_perfil') {
                            await i.update({ files: [attachment], embeds: [], components: [row] });
                        } else {
                            const fullLogs = await db.query('SELECT author_id, timestamp, message FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 50', [targetUser.id]);
                            await handlePagination(i, fullLogs.rows, targetUser);
                        }
                    }
                });

            } catch (err) {
                console.error(err);
                interaction.editReply("❌ Erro ao gerar.");
            }
        }

        // --- SUBCOMANDO: BIO ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            await db.query(`INSERT INTO social_users (user_id, bio) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET bio = $2`, [interaction.user.id, bioText]);
            return interaction.reply({ content: `✅ Bio salva!`, ephemeral: true });
        }

        // --- SUBCOMANDO: ELOGIAR (AGORA COM MODAL) ---
        if (subcommand === 'elogiar') {
            const targetUser = interaction.options.getUser('usuario');
            if (targetUser.id === interaction.user.id) return interaction.reply({ content: "❌ Você não pode se elogiar.", ephemeral: true });
            
            // Verifica Cooldown (Opcional, se quiser manter sem limites, ignore)
            // ... (Seu código de verificação aqui se quiser)

            // CRIA O MODAL
            // Importante: Passamos o ID do alvo no customId do modal para saber quem recebe depois
            const modal = new ModalBuilder()
                .setCustomId(`social_elogiar_submit_${targetUser.id}`) 
                .setTitle(`Elogiar ${targetUser.username.substring(0, 20)}`);

            const messageInput = new TextInputBuilder()
                .setCustomId('mensagem_input')
                .setLabel("Deixe uma mensagem (Opcional)")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("Ex: Você é um ótimo líder!")
                .setRequired(false) // <--- Isso deixa opcional
                .setMaxLength(100);

            const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(firstActionRow);

            // Abre o modal!
            await interaction.showModal(modal);
        }
    }
};

// ... Função de Paginação igual à anterior ...
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