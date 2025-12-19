const db = require('../../database.js');
const generateProfileImage = require('../../ui/profileCanvas.js');

module.exports = {
    async execute(interaction) {
        // Resposta Ephemeral (Visível apenas para quem usou)
        await interaction.deferReply({ ephemeral: true });

        try {
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) {
                return interaction.editReply({ content: '❌ Usuário não encontrado neste servidor.' });
            }

            const guildId = interaction.guild.id;

            // 1. Buscar Perfil (Bio, Tema)
            // Se der erro na tabela user_profiles, usa valores padrão
            let profileData = { theme_color: '#5865F2', bio: 'Sem bio.' };
            try {
                const profileRes = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [targetUser.id]);
                if (profileRes.rows.length > 0) profileData = profileRes.rows[0];
            } catch (err) {
                console.warn('[Perfil] Tabela user_profiles não acessível, usando padrão.');
            }

            // 2. Buscar Voz (XP, Nível)
            let voiceData = { xp: 0, level: 0, voice_time_mins: 0 };
            try {
                const voiceRes = await db.query(
                    'SELECT * FROM user_voice_data WHERE user_id = $1 AND guild_id = $2', 
                    [targetUser.id, guildId]
                );
                if (voiceRes.rows.length > 0) voiceData = voiceRes.rows[0];
            } catch (err) {
                // Tabela pode não existir ainda se o monitor não rodou
            }

            // 3. Buscar Reputação
            let repData = { count: 0, last_message: null, last_author: 'Ninguém' };
            try {
                const repCountRes = await db.query('SELECT COUNT(*) FROM user_reputation WHERE target_id = $1', [targetUser.id]);
                const repLastRes = await db.query(
                    'SELECT * FROM user_reputation WHERE target_id = $1 ORDER BY created_at DESC LIMIT 1', 
                    [targetUser.id]
                );
                
                repData.count = repCountRes.rows[0].count;
                
                if (repLastRes.rows.length > 0) {
                    const lastRep = repLastRes.rows[0];
                    repData.last_message = lastRep.message;
                    
                    const authorUser = await interaction.client.users.fetch(lastRep.author_id).catch(() => null);
                    repData.last_author = authorUser ? authorUser.username : 'Desconhecido';
                }
            } catch (err) {
                // Tabela reputação pode não existir
            }

            // 4. Gerar a Imagem (Canvas)
            const attachment = await generateProfileImage(targetMember, profileData, voiceData, repData);

            // Botão de Editar (Apenas se for o dono do perfil)
            const components = [];
            if (targetUser.id === interaction.user.id) {
                components.push({
                    type: 1, // ActionRow
                    components: [{
                        type: 2, // Button
                        style: 2, // Secondary
                        label: 'Editar Perfil',
                        emoji: { name: '🎨' },
                        custom_id: 'profile_edit_menu'
                    }]
                });
            }

            await interaction.editReply({ 
                content: `🖼️ **Perfil Koda de ${targetUser.username}**`,
                files: [attachment],
                components: components
            });

        } catch (error) {
            console.error('Erro fatal no comando perfil:', error);
            await interaction.editReply('❌ Ocorreu um erro ao gerar a imagem. Verifique se o módulo `canvas` está instalado no bot.');
        }
    }
};