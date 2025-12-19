const db = require('../../database.js');
const generateProfileUI = require('../../ui/profileCard.js');

module.exports = {
    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({ content: '❌ Usuário não encontrado neste servidor.' });
        }

        // Buscar dados do banco
        let result = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [targetUser.id]);
        
        // Se não existir, cria um perfil padrão na memória (não precisa salvar no DB até ele editar)
        const profileData = result.rows[0] || {
            user_id: targetUser.id,
            bio: 'Olá! Sou novo por aqui.',
            theme_color: '#5865F2', // Blurple padrão
            theme_image: null
        };

        const uiPayload = generateProfileUI(targetMember, profileData);

        // Se não for o próprio usuário, remove o botão de editar
        if (targetUser.id !== interaction.user.id) {
            uiPayload.components = [];
        }

        await interaction.editReply(uiPayload);
    }
};