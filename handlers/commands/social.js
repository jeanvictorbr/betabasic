const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // --- SUBCOMANDO: PERFIL ---
        if (subcommand === 'perfil') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("❌ Usuário não encontrado no servidor.");

            try {
                // Buscas paralelas no DB
                const [flowRes, pontoRes, socialRes, allTagsRes, repHistoryRes] = await Promise.all([
                    db.query('SELECT balance FROM flow_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT role_id, tag FROM role_tags WHERE guild_id = $1', [interaction.guild.id]),
                    db.query('SELECT author_id FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 3', [targetUser.id])
                ]);

                const flowData = flowRes.rows[0] || { balance: 0 };
                const pontoData = pontoRes.rows[0] || { total_ms: 0 };
                // Background_url ignorado aqui, pois vamos forçar o tema natalino no gerador se não tiver
                const socialData = socialRes.rows[0] || { reputation: 0, bio: null };
                
                // Filtra as Badges
                const userBadges = allTagsRes.rows.filter(row => targetMember.roles.cache.has(row.role_id));

                // Busca avatares dos últimos elogiadores
                const lastRepUsers = [];
                for (const row of repHistoryRes.rows) {
                    const u = await interaction.client.users.fetch(row.author_id).catch(() => null);
                    if (u) lastRepUsers.push(u);
                }

                // Gera a imagem
                const buffer = await generateProfileCard(targetUser, targetMember, flowData, pontoData, socialData, userBadges, lastRepUsers);
                const attachment = new AttachmentBuilder(buffer, { name: 'social-card.png' });

                await interaction.editReply({ files: [attachment] });

            } catch (error) {
                console.error('Erro SocialCard:', error);
                await interaction.editReply({ content: '❌ Erro ao gerar perfil.' });
            }
        }

        // --- SUBCOMANDO: BIO ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            
            if (bioText.length > 150) {
                return interaction.reply({ content: "❌ A biografia não pode ter mais de 150 caracteres.", flags: 1 << 6 });
            }

            await db.query(`
                INSERT INTO social_users (user_id, bio) VALUES ($1, $2)
                ON CONFLICT (user_id) DO UPDATE SET bio = $2
            `, [interaction.user.id, bioText]);

            return interaction.reply({ content: `✅ **Biografia atualizada!**\n> *"${bioText}"*`, flags: 1 << 6 });
        }

        // --- SUBCOMANDO: ELOGIAR ---
        if (subcommand === 'elogiar') {
            const targetUser = interaction.options.getUser('usuario');
            const authorId = interaction.user.id;

            if (targetUser.id === authorId) return interaction.reply({ content: "❌ Você não pode se auto-elogiar.", flags: 1 << 6 });
            if (targetUser.bot) return interaction.reply({ content: "❌ Bots não precisam de reputação.", flags: 1 << 6 });

            // 1. Verifica Cooldown (24h)
            const authorData = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [authorId]);
            const now = new Date();
            
            if (authorData.rows.length > 0 && authorData.rows[0].last_rep_given) {
                const lastRep = new Date(authorData.rows[0].last_rep_given);
                const diff = now - lastRep;
                const oneDay = 24 * 60 * 60 * 1000;

                if (diff < oneDay) {
                    const nextRep = new Date(lastRep.getTime() + oneDay);
                    return interaction.reply({ 
                        content: `⏳ **Aguarde!** Você já elogiou hoje. Volte <t:${Math.floor(nextRep.getTime() / 1000)}:R>.`, 
                        flags: 1 << 6 
                    });
                }
            }

            try {
                // 2. Aplica Reputação
                await db.query(`
                    INSERT INTO social_users (user_id, reputation) VALUES ($1, 1)
                    ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1
                `, [targetUser.id]);

                // 3. Salva Log (Para aparecer a foto no perfil)
                await db.query(`
                    INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())
                `, [targetUser.id, authorId]);

                // 4. Atualiza Cooldown
                await db.query(`
                    INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, $2)
                    ON CONFLICT (user_id) DO UPDATE SET last_rep_given = $2
                `, [authorId, now]);

                return interaction.reply({ 
                    content: `🌟 **Sucesso!** Você elogiou ${targetUser} (+1 Rep).` 
                });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "❌ Erro ao salvar elogio.", flags: 1 << 6 });
            }
        }
    }
};