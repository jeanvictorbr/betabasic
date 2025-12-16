const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    // Mantendo 'execute' como seu bot espera
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // --- SUBCOMANDO: PERFIL ---
        if (subcommand === 'perfil') {
            // 1. Loading apenas para quem digitou (Ephemeral)
            await interaction.deferReply({ ephemeral: true });
            
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("❌ Usuário não encontrado no servidor.");

            try {
                // 2. Buscas no Banco de Dados
                const [flowRes, pontoRes, socialRes, allTagsRes, repHistoryRes] = await Promise.all([
                    db.query('SELECT balance FROM flow_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT role_id, tag FROM role_tags WHERE guild_id = $1', [interaction.guild.id]),
                    db.query('SELECT author_id FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 3', [targetUser.id])
                ]);

                // 3. Preparando Dados
                const flowData = flowRes.rows[0] || { balance: 0 };
                const pontoData = pontoRes.rows[0] || { total_ms: 0 };
                const socialData = socialRes.rows[0] || { reputation: 0, bio: 'Sem biografia...' };
                
                // Badges (Cargos)
                const userBadges = allTagsRes.rows
                    .filter(row => targetMember.roles.cache.has(row.role_id))
                    .map(row => ({ icon: '🏅', name: row.tag })); // Se tiver emoji no banco, troque '🏅' por row.emoji

                // Últimos Elogios (Avatares)
                const lastRepUsers = [];
                for (const row of repHistoryRes.rows) {
                    try {
                        const u = await interaction.client.users.fetch(row.author_id);
                        lastRepUsers.push(u);
                    } catch (e) {}
                }

                // 4. Gerando Imagem
                const buffer = await generateProfileCard(
                    targetUser, 
                    {
                        ...socialData,
                        money: flowData.balance,
                        atividade: pontoData.total_ms,
                        badges: userBadges,
                        recentReps: lastRepUsers
                    }
                );
                
                const attachment = new AttachmentBuilder(buffer, { name: 'social-card.png' });

                // 5. Botões
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`social_elogiar_${targetUser.id}`) // ID para capturar no interactionCreate
                        .setLabel('Elogiar (+1 Rep)')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(targetUser.id === interaction.user.id),
                    
                    new ButtonBuilder()
                        .setLabel('Ver Avatar')
                        .setURL(targetUser.displayAvatarURL())
                        .setStyle(ButtonStyle.Link)
                );

                await interaction.editReply({ 
                    content: `🎨 **Perfil de ${targetUser}**`,
                    files: [attachment],
                    components: [row]
                });

            } catch (error) {
                console.error('Erro SocialCard:', error);
                await interaction.editReply({ content: '❌ Erro ao gerar imagem.' });
            }
        }

        // --- SUBCOMANDO: BIO ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            
            if (bioText.length > 150) {
                return interaction.reply({ content: "❌ Máximo 150 caracteres.", ephemeral: true });
            }

            try {
                await db.query(`
                    INSERT INTO social_users (user_id, bio) VALUES ($1, $2)
                    ON CONFLICT (user_id) DO UPDATE SET bio = $2
                `, [interaction.user.id, bioText]);

                return interaction.reply({ content: `✅ **Bio atualizada!**\n> "${bioText}"`, ephemeral: true });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "❌ Erro no DB.", ephemeral: true });
            }
        }

        // --- SUBCOMANDO: ELOGIAR ---
        if (subcommand === 'elogiar') {
            const targetUser = interaction.options.getUser('usuario');
            const authorId = interaction.user.id;

            if (targetUser.id === authorId) return interaction.reply({ content: "❌ Não pode se auto-elogiar.", ephemeral: true });
            if (targetUser.bot) return interaction.reply({ content: "❌ Bots não aceitam rep.", ephemeral: true });

            // Cooldown Check
            const authorData = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [authorId]);
            const now = new Date();
            
            if (authorData.rows.length > 0 && authorData.rows[0].last_rep_given) {
                const lastRep = new Date(authorData.rows[0].last_rep_given);
                const oneDay = 24 * 60 * 60 * 1000;
                if ((now - lastRep) < oneDay) {
                    const nextRep = Math.floor((lastRep.getTime() + oneDay) / 1000);
                    return interaction.reply({ content: `⏳ Volte <t:${nextRep}:R>.`, ephemeral: true });
                }
            }

            try {
                await db.query(`INSERT INTO social_users (user_id, reputation) VALUES ($1, 1) ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1`, [targetUser.id]);
                await db.query(`INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())`, [targetUser.id, authorId]);
                await db.query(`INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET last_rep_given = $2`, [authorId, now]);

                return interaction.reply({ content: `🌟 Elogio enviado para **${targetUser.username}**!`, ephemeral: true });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "❌ Erro ao salvar.", ephemeral: true });
            }
        }
    }
};