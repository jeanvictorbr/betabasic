const db = require('../../database.js');
const generateProfileImage = require('../../ui/profileCanvas.js');

module.exports = {
    async execute(interaction) {
        // RESPOSTA EPHEMERAL OBRIGATÓRIA
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({ content: '❌ Usuário não encontrado neste servidor.' });
        }

        const guildId = interaction.guild.id;

        // 1. Buscar Dados do Perfil (Bio, Tema)
        const profileRes = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [targetUser.id]);
        const profileData = profileRes.rows[0] || { theme_color: '#5865F2', bio: 'Sem bio.' };

        // 2. Buscar Dados de Voz (XP, Nível)
        const voiceRes = await db.query(
            'SELECT * FROM user_voice_data WHERE user_id = $1 AND guild_id = $2', 
            [targetUser.id, guildId]
        );
        const voiceData = voiceRes.rows[0] || { xp: 0, level: 0, voice_time_mins: 0 };

        // 3. Buscar Reputação (Contagem e Último Elogio)
        const repCountRes = await db.query('SELECT COUNT(*) FROM user_reputation WHERE target_id = $1', [targetUser.id]);
        const repLastRes = await db.query(
            'SELECT * FROM user_reputation WHERE target_id = $1 ORDER BY created_at DESC LIMIT 1', 
            [targetUser.id]
        );
        
        let lastAuthorName = 'Anônimo';
        if (repLastRes.rows.length > 0) {
            const authorId = repLastRes.rows[0].author_id;
            const authorMember = await interaction.guild.members.fetch(authorId).catch(() => null);
            lastAuthorName = authorMember ? authorMember.user.username : 'Desconhecido';
        }

        const repData = {
            count: repCountRes.rows[0].count,
            last_message: repLastRes.rows.length > 0 ? repLastRes.rows[0].message : null,
            last_author: lastAuthorName
        };

        // 4. Gerar a Imagem
        try {
            const attachment = await generateProfileImage(targetMember, profileData, voiceData, repData);

            // Botão de Editar (Só se for o próprio usuário)
            const components = [];
            if (targetUser.id === interaction.user.id) {
                components.push({
                    type: 1,
                    components: [{
                        type: 2,
                        style: 2, // Secondary
                        label: 'Editar Perfil',
                        emoji: { name: '🎨' },
                        custom_id: 'profile_edit_menu'
                    }]
                });
            }

            await interaction.editReply({ 
                content: `Aqui está o perfil de **${targetUser.username}**:`,
                files: [attachment],
                components: components
            });

        } catch (error) {
            console.error('Erro ao gerar imagem de perfil:', error);
            await interaction.editReply('❌ Ocorreu um erro ao gerar a imagem do perfil.');
        }
    }
};