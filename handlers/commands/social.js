const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');

module.exports = {
    // Configurações do comando (nome, descrição, options) devem estar aqui ou no deploy-commands.js
    // Mantenha como você já tem configurado a estrutura do comando slash.
    
    async run(client, interaction) { // Mudei para run(client, interaction) para seguir padrão comum, ajuste se for execute(interaction)
        const subcommand = interaction.options.getSubcommand();

        // --- SUBCOMANDO: PERFIL ---
        if (subcommand === 'perfil') {
            // 1. Resposta Ephemeral (Visível apenas para o usuário)
            await interaction.deferReply({ ephemeral: true });
            
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) return interaction.editReply("❌ Usuário não encontrado no servidor.");

            try {
                // 2. Buscas paralelas no Banco de Dados (Otimizado)
                const [flowRes, pontoRes, socialRes, allTagsRes, repHistoryRes] = await Promise.all([
                    db.query('SELECT balance FROM flow_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                    db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                    db.query('SELECT role_id, tag, emoji FROM role_tags WHERE guild_id = $1', [interaction.guild.id]), // Assumi que tem coluna emoji, se não tiver, usa tag
                    db.query('SELECT author_id FROM social_rep_logs WHERE target_id = $1 ORDER BY timestamp DESC LIMIT 3', [targetUser.id])
                ]);

                // 3. Tratamento de Dados
                const flowData = flowRes.rows[0] || { balance: 0 };
                const pontoData = pontoRes.rows[0] || { total_ms: 0 };
                const socialData = socialRes.rows[0] || { reputation: 0, bio: 'Sem biografia...', background_url: null };
                
                // Filtra as Badges baseadas nos cargos do usuário
                const userBadges = allTagsRes.rows
                    .filter(row => targetMember.roles.cache.has(row.role_id))
                    .map(row => ({
                        icon: row.emoji || row.tag || '🏅', // Usa emoji do banco ou um padrão
                        name: row.tag
                    }));

                // Adiciona Badges manuais do sistema social se houver
                if (socialData.badges) {
                    // Se badges for string JSON, faça parse, se for array, use direto
                    const manualBadges = Array.isArray(socialData.badges) ? socialData.badges : [];
                    userBadges.push(...manualBadges);
                }

                // Busca objetos de usuário para os últimos que elogiaram (para o gerador desenhar os avatares)
                const lastRepUsers = [];
                for (const row of repHistoryRes.rows) {
                    try {
                        const u = await client.users.fetch(row.author_id);
                        lastRepUsers.push(u);
                    } catch (e) { /* Usuário saiu ou erro */ }
                }

                // 4. Geração da Imagem
                // Passamos os dados limpos para o gerador
                const buffer = await generateProfileCard(
                    targetUser, 
                    {
                        ...socialData,
                        money: flowData.balance,
                        atividade: pontoData.total_ms, // O gerador deve converter ms para horas
                        badges: userBadges,
                        recentReps: lastRepUsers
                    }
                );
                
                const attachment = new AttachmentBuilder(buffer, { name: `social-card-${targetUser.id}.png` });

                // 5. Botões de Interação
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`social_elogiar_${targetUser.id}`)
                        .setLabel('Elogiar (+1 Rep)')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(targetUser.id === interaction.user.id), // Desabilita se for o próprio perfil
                    
                    new ButtonBuilder()
                        .setLabel('Link Avatar')
                        .setURL(targetUser.displayAvatarURL({ size: 1024 }))
                        .setStyle(ButtonStyle.Link)
                );

                await interaction.editReply({ 
                    content: `🎨 **Perfil Social de ${targetUser}**`,
                    files: [attachment],
                    components: [row]
                });

            } catch (error) {
                console.error('Erro SocialCard:', error);
                await interaction.editReply({ content: '❌ Ocorreu um erro ao gerar a imagem do perfil. Tente novamente.' });
            }
        }

        // --- SUBCOMANDO: BIO ---
        if (subcommand === 'bio') {
            const bioText = interaction.options.getString('texto');
            
            if (bioText.length > 150) {
                return interaction.reply({ content: "❌ A biografia não pode ter mais de 150 caracteres.", ephemeral: true });
            }

            try {
                await db.query(`
                    INSERT INTO social_users (user_id, bio) VALUES ($1, $2)
                    ON CONFLICT (user_id) DO UPDATE SET bio = $2
                `, [interaction.user.id, bioText]);

                return interaction.reply({ content: `✅ **Biografia atualizada com sucesso!**\n> *"${bioText}"*`, ephemeral: true });
            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "❌ Erro no banco de dados.", ephemeral: true });
            }
        }

        // --- SUBCOMANDO: ELOGIAR ---
        if (subcommand === 'elogiar') {
            const targetUser = interaction.options.getUser('usuario');
            const authorId = interaction.user.id;

            if (targetUser.id === authorId) return interaction.reply({ content: "❌ Você não pode se auto-elogiar, espertinho.", ephemeral: true });
            if (targetUser.bot) return interaction.reply({ content: "❌ Bots não possuem sentimentos (ainda).", ephemeral: true });

            // 1. Verifica Cooldown (24h)
            const authorData = await db.query('SELECT last_rep_given FROM social_users WHERE user_id = $1', [authorId]);
            const now = new Date();
            
            if (authorData.rows.length > 0 && authorData.rows[0].last_rep_given) {
                const lastRep = new Date(authorData.rows[0].last_rep_given);
                const diff = now - lastRep;
                const oneDay = 24 * 60 * 60 * 1000;

                if (diff < oneDay) {
                    const nextRep = new Date(lastRep.getTime() + oneDay);
                    // Formato Timestamp do Discord <t:TIMESTAMP:R> mostra "em 5 horas"
                    return interaction.reply({ 
                        content: `⏳ **Calma lá!** Você já elogiou alguém hoje.\nTente novamente <t:${Math.floor(nextRep.getTime() / 1000)}:R>.`, 
                        ephemeral: true 
                    });
                }
            }

            try {
                // Transação simples (ou queries sequenciais)
                // 2. Adiciona +1 Reputação
                await db.query(`
                    INSERT INTO social_users (user_id, reputation) VALUES ($1, 1)
                    ON CONFLICT (user_id) DO UPDATE SET reputation = social_users.reputation + 1
                `, [targetUser.id]);

                // 3. Registra o Log (Importante para aparecer a foto de quem elogiou no card)
                await db.query(`
                    INSERT INTO social_rep_logs (target_id, author_id, timestamp) VALUES ($1, $2, NOW())
                `, [targetUser.id, authorId]);

                // 4. Atualiza o Cooldown de quem enviou
                await db.query(`
                    INSERT INTO social_users (user_id, last_rep_given) VALUES ($1, $2)
                    ON CONFLICT (user_id) DO UPDATE SET last_rep_given = $2
                `, [authorId, now]);

                return interaction.reply({ 
                    content: `🌟 **Sucesso!** Você enviou um elogio (+1 Rep) para ${targetUser}.`, 
                    ephemeral: true 
                });

            } catch (err) {
                console.error(err);
                return interaction.reply({ content: "❌ Erro ao processar o elogio no banco de dados.", ephemeral: true });
            }
        }
    }
};