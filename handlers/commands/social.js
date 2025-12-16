const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // --- PERFIL ---
        if (subcommand === 'perfil') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("Usuário não encontrado no servidor.");

            try {
                const [flowRes, pontoRes, socialRes, allTagsRes, repHistoryRes] = await Promise.all([
                    db.query('SELECT balance FROM flow_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT role_id, tag FROM role_tags WHERE guild_id = $1', [interaction.guild.id]),
                    // Busca os últimos 3 elogios
                    db.query('SELECT author_id FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 3', [targetUser.id])
                ]);

                const flowData = flowRes.rows[0] || { balance: 0 };
                const pontoData = pontoRes.rows[0] || { total_ms: 0 };
                const socialData = socialRes.rows[0] || { reputation: 0, bio: null, background_url: null };
                
                // Badges
                const userBadges = allTagsRes.rows.filter(row => targetMember.roles.cache.has(row.role_id));

                // Busca objetos de usuário do Discord para os elogios (para pegar o avatar)
                const lastRepUsers = [];
                for (const row of repHistoryRes.rows) {
                    const u = await interaction.client.users.fetch(row.author_id).catch(() => null);
                    if (u) lastRepUsers.push(u);
                }

                const buffer = await generateProfileCard(targetUser, targetMember, flowData, pontoData, socialData, userBadges, lastRepUsers);
                const attachment = new AttachmentBuilder(buffer, { name: 'social-card.png' });

                await interaction.editReply({ files: [attachment] });

            } catch (error) {
                console.error('Erro SocialCard:', error);
                await interaction.editReply({ content: '❌ Erro ao gerar perfil.' });
            }
        }

        // --- BIO ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            if (bioText.length > 150) return interaction.reply({ content: "❌ Máximo 150 caracteres.", flags: 1 << 6 });

            await db.query(`
                INSERT INTO social_users (user_id, bio) VALUES ($1, $2)
                ON CONFLICT (user_id) DO UPDATE SET bio = $2
            `, [interaction.user.id, bioText]);

            return interaction.reply({ content: `✅ Biografia atualizada!`, flags: 1 << 6 });
        }

        // --- BACKGROUND ---
        if (subcommand === 'background') {
            const url = interaction.options.getString('url');
            if (!url.match(/\.(jpeg|jpg|gif|png)$/) && !url.includes('imgur')) {
                return interaction.reply({ content: "❌ Link inválido (Use .png, .jpg ou imgur).", flags: 1 << 6 });
            }

            await db.query(`
                INSERT INTO social_users (user_id, background_url) VALUES ($1, $2)
                ON CONFLICT (user_id) DO UPDATE SET background_url = $2
            `, [interaction.user.id, url]);

            return interaction.reply({ content: "✅ Background atualizado!", flags: 1 << 6 });
        }

        // --- ELOGIAR ---
        if (subcommand === 'elogiar') {
            const targetUser = interaction.options.getUser('usuario');
            const authorId = interaction.user.id;

            if (targetUser.id === authorId) return interaction.reply({ content: "❌ Auto-elogio não conta!", flags: 1 << 6 });
            if (targetUser.bot) return interaction.reply({ content: "❌ Bots não aceitam elogios.", flags: 1 << 6 });

            // Cooldown
            const authorData = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [authorId]);
            const now = new Date();
            
            if (authorData.rows.length > 0 && authorData.rows[0].last_rep_given) {
                const lastRep = new Date(authorData.rows[0].last_rep_given);
                const diff = now - lastRep;
                const oneDay = 24 * 60 * 60 * 1000;

                if (diff < oneDay) {
                    const nextRep = new Date(lastRep.getTime() + oneDay);
                    return interaction.reply({ 
                        content: `⏳ Você já elogiou hoje. Volte <t:${Math.floor(nextRep.getTime() / 1000)}:R>.`, 
                        flags: 1 << 6 
                    });
                }
            }

            // Transação segura
            try {
                // 1. Sobe reputação
                await db.query(`
                    INSERT INTO social_users (user_id, reputation) VALUES ($1, 1)
                    ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1
                `, [targetUser.id]);

                // 2. Salva Log (para aparecer no perfil)
                await db.query(`
                    INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())
                `, [targetUser.id, authorId]);

                // 3. Atualiza Cooldown
                await db.query(`
                    INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, $2)
                    ON CONFLICT (user_id) DO UPDATE SET last_rep_given = $2
                `, [authorId, now]);

                return interaction.reply({ 
                    content: `🌟 **Sucesso!** Você elogiou ${targetUser}.` 
                });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "Erro ao processar elogio.", flags: 1 << 6 });
            }
        }
    }
};