const db = require('../../database.js');
const { generateProfileCard } = require('../../utils/profileGenerator.js');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        try {
            // 1. Buscas Paralelas no Banco de Dados para eficiência
            const [flowRes, pontoRes, socialRes, allTagsRes] = await Promise.all([
                db.query('SELECT balance FROM flow_users WHERE user_id = $1', [targetUser.id]),
                db.query('SELECT total_ms FROM ponto_leaderboard WHERE user_id = $1 AND guild_id = $2', [targetUser.id, interaction.guild.id]),
                db.query('SELECT * FROM social_users WHERE user_id = $1', [targetUser.id]),
                db.query('SELECT role_id, tag FROM role_tags WHERE guild_id = $1', [interaction.guild.id])
            ]);

            const flowData = flowRes.rows[0] || { balance: 0 };
            const pontoData = pontoRes.rows[0] || { total_ms: 0 };
            const socialData = socialRes.rows[0] || { reputation: 0 };
            
            // 2. Filtrar Badges (Tags)
            // Verifica quais roles o usuário tem que batem com as roles cadastradas em role_tags
            const userBadges = allTagsRes.rows.filter(row => 
                targetMember.roles.cache.has(row.role_id)
            );

            // 3. Gerar Imagem
            const buffer = await generateProfileCard(
                targetUser, 
                targetMember, 
                flowData, 
                pontoData, 
                socialData, 
                userBadges
            );

            const attachment = new AttachmentBuilder(buffer, { name: 'profile-card.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error('Erro ao gerar perfil:', error);
            await interaction.editReply({ content: '❌ Erro ao gerar o cartão de perfil.' });
        }
    }
};