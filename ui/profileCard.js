const createProgressBar = require('../utils/progressBar.js');
const { time } = require('discord.js');

/**
 * Gera o JSON do Perfil V2
 * @param {Object} member - O objeto GuildMember do Discord
 * @param {Object} profileData - Dados do DB (bio, tema, etc)
 */
module.exports = (member, profileData) => {
    const user = member.user;
    
    // Tratamento de cor: garante que é um inteiro ou string hex válida
    let themeColor = 0x5865F2;
    if (profileData.theme_color) {
        // Remove aspas extras que podem ter vindo do DB por causa do erro anterior
        let cleanColor = profileData.theme_color.replace(/['"]/g, '');
        if (cleanColor.startsWith('#')) {
            themeColor = parseInt(cleanColor.replace('#', ''), 16);
        }
    }
    
    // Simulação de Nível (Dias de conta)
    const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));
    const level = Math.floor(accountAgeDays / 30);
    const progressBar = createProgressBar(accountAgeDays % 30, 30, 8);

    // Formatação de data nativa do Discord (User Friendly)
    const joinedAtDisplay = member.joinedAt ? time(member.joinedAt, 'D') : 'N/A';
    const createdAtDisplay = time(user.createdAt, 'D');

    // Remove aspas extras da Bio se existirem
    let bioText = profileData.bio || 'Sem bio definida.';
    if (bioText.startsWith("'") && bioText.endsWith("'")) {
        bioText = bioText.slice(1, -1);
    }

    const embed = {
        type: 'rich',
        title: `Perfil de ${user.username}`,
        description: `> *${bioText}*`,
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
                value: `**Entrou:** ${joinedAtDisplay}\n**Criou:** ${createdAtDisplay}`,
                inline: true
            },
            {
                name: `🆙 Nível ${level} (Veterania)`,
                value: `\`${progressBar}\` ${(accountAgeDays % 30)}/30 XP`,
                inline: false
            }
        ],
        footer: {
            text: `Koda Profiles • Solicitado por ${user.username}`,
            icon_url: user.displayAvatarURL()
        }
    };

    // Se tiver imagem de tema personalizada, adiciona como imagem grande
    if (profileData.theme_image && profileData.theme_image.startsWith('http')) {
        embed.image = { url: profileData.theme_image };
    }

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