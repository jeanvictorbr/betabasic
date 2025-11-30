// ui/devPanel/devGuildManageMenu.js
const { ButtonStyle } = require('discord.js'); // Apenas para referência de estilos, usaremos objeto cru (Type 17)

module.exports = function generateDevGuildManageMenu(interaction, guild, settings, ownerInStore) {
    
    // Formata status do dono com Emoji evidente
    const ownerStatusDisplay = ownerInStore 
        ? "✅ **PRESENTE NA LOJA**" 
        : "❌ **AUSENTE DA LOJA** (Não está no servidor oficial)";

    const embed = {
        title: `🔧 Gerenciar Guilda: ${guild.name}`,
        description: `Aqui você pode controlar as configurações e licenças desta guilda remotamente.\n\n` +
                     `👑 **Dono da Guilda:** <@${guild.ownerId}> (\`${guild.ownerId}\`)\n` +
                     `🏢 **Status do Cliente:** ${ownerStatusDisplay}\n` + // NOVA LINHA AQUI
                     `🆔 **ID da Guilda:** \`${guild.id}\`\n` +
                     `👥 **Membros:** \`${guild.memberCount}\`\n` +
                     `📅 **Entrou em:** <t:${Math.floor(guild.joinedTimestamp / 1000)}:R>`,
        color: 0x2B2D31, // Cor escura padrão Discord
        thumbnail: { url: guild.iconURL({ dynamic: true }) },
        fields: [
            {
                name: '💎 Status Premium/Licença',
                value: settings?.premium_active 
                    ? `✅ **Ativo** (Expira: <t:${Math.floor(new Date(settings.premium_expires).getTime() / 1000)}:R>)` 
                    : '❌ **Inativo**',
                inline: true
            },
            {
                name: '🤖 Sistema de IA',
                value: settings?.ai_enabled ? '✅ Habilitado' : '❌ Desabilitado',
                inline: true
            },
            {
                name: '🛡️ Guardian (Anti-Raid)',
                value: settings?.guardian_status ? '✅ Ativo' : '❌ Inativo',
                inline: true
            }
        ],
        footer: {
            text: `Painel de Desenvolvedor • ${interaction.user.username}`,
            icon_url: interaction.user.displayAvatarURL()
        },
        timestamp: new Date().toISOString()
    };

    // Botões de Ação (V2 Components Type 1)
    const components = [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: settings?.premium_active ? "Editar Validade Premium" : "Adicionar Premium",
                    style: 1, // Primary (Blurple)
                    custom_id: `dev_guild_edit_expiry_${guild.id}`,
                    emoji: { name: "💎" }
                },
                {
                    type: 2,
                    label: "Alternar IA",
                    style: 2, // Secondary (Grey)
                    custom_id: `dev_guild_toggle_ai_${guild.id}`,
                    emoji: { name: "🤖" }
                },
                {
                    type: 2,
                    label: "Ver Activity Log",
                    style: 2, // Secondary
                    custom_id: `dev_guild_inspect_activity_${guild.id}`,
                    emoji: { name: "📜" }
                },
                {
                    type: 2,
                    label: "Sair da Guilda (Force Leave)",
                    style: 4, // Danger (Red)
                    custom_id: `dev_guild_force_leave_${guild.id}`,
                    emoji: { name: "🚪" }
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: "Voltar para Lista",
                    style: 2, // Secondary
                    custom_id: "dev_guilds_page_0", // Volta para primeira página
                    emoji: { name: "⬅️" }
                }
            ]
        }
    ];

    return { embeds: [embed], components: components };
};