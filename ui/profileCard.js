// ui/profileCard.js
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const createProgressBar = require('../utils/progressBar.js');

/**
 * Gera o JSON do Perfil V2
 * @param {Object} member - O objeto GuildMember do Discord
 * @param {Object} profileData - Dados do DB (bio, tema, etc)
 */
module.exports = (member, profileData) => {
    const user = member.user;
    const themeColor = profileData.theme_color ? parseInt(profileData.theme_color.replace('#', ''), 16) : 0x5865F2;
    
    // Simulação de Nível (Substitua pela sua lógica real de XP se tiver)
    // Aqui usamos dias de conta como "XP" para exemplo
    const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
    const level = Math.floor(accountAgeDays / 30);
    const nextLevelXp = (level + 1) * 30;
    const progressBar = createProgressBar(accountAgeDays % 30, 30, 8);

    // Datas formatadas
    const joinedAt = format(member.joinedAt, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
    const createdAt = format(user.createdAt, "dd 'de' MMM 'de' yyyy", { locale: ptBR });

    const embed = {
        type: 'rich',
        title: `Perfil de ${user.username}`,
        description: `> *${profileData.bio || 'Sem bio definida.'}*`,
        color: themeColor,
        thumbnail: {
            url: user.displayAvatarURL({ dynamic: true, size: 256 })
        },
        fields: [
            {
                name: '👤 Identidade',
                value: `**Tag:** \`${user.tag}\`\n**ID:** \`${user.id}\``,
                inline: true
            },
            {
                name: '📅 Marcos Temporais',
                value: `**Entrou:** ${joinedAt}\n**Criou:** ${createdAt}`,
                inline: true
            },
            {
                name: `🆙 Nível ${level}`,
                value: `\`${progressBar}\` ${(accountAgeDays % 30)}/30 XP`,
                inline: false
            }
        ],
        footer: {
            text: `Koda Profiles • Solicitado por ${user.username}`,
            icon_url: 'https://cdn.discordapp.com/emojis/1056902047863509062.png' // Ícone genérico ou do bot
        }
    };

    // Se tiver imagem de tema personalizada, adiciona como imagem grande
    if (profileData.theme_image && profileData.theme_image.startsWith('http')) {
        embed.image = { url: profileData.theme_image };
    }

    // Componentes (Botão de Editar) - Apenas se for o próprio usuário vendo (tratado no handler)
    // Mas retornamos a estrutura base aqui.
    const components = [
        {
            type: 1, // ActionRow
            components: [
                {
                    type: 2, // Button
                    style: 2, // Secondary
                    label: 'Editar Perfil',
                    emoji: { name: '🎨' },
                    custom_id: 'profile_edit_menu'
                }
            ]
        }
    ];

    return {
        embeds: [embed],
        components: components
    };
};