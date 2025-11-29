const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = (guild, data) => {
    // data contém: ownerName, activeModulesList, guildSettings, joinedDays, healthStatus

    // Formata a lista de módulos
    const modulesString = data.activeModulesList.length > 0 
        ? data.activeModulesList.join('\n') 
        : "⚠️ *Nenhum módulo ativado.*";

    // Ícone da guilda ou padrão
    const iconUrl = guild.iconURL({ dynamic: true, size: 256 }) || "https://cdn.discordapp.com/embed/avatars/0.png";

    const embed = {
        type: "rich",
        title: `🔧 Gerenciar Guilda: ${guild.name}`,
        description: `Aqui estão os detalhes técnicos e operacionais desta guilda. Use os controles abaixo para administrar.`,
        color: 0x2B2D31, // Dark theme
        thumbnail: { url: iconUrl },
        fields: [
            {
                name: "📊 Diagnóstico (Para Faxina)",
                value: `Status: ${data.healthStatus}\nDias no Servidor: **${data.joinedDays} dias**\nMembros: **${guild.memberCount}**\nBots: **${guild.members.cache.filter(m => m.user.bot).size}**`,
                inline: false
            },
            {
                name: "📦 Módulos Ativos (Uso Real)",
                value: `\`\`\`\n${modulesString}\n\`\`\``,
                inline: false
            },
            {
                name: "👑 Proprietário & ID",
                value: `👤 ${data.ownerName}\n🆔 \`${guild.id}\``,
                inline: true
            },
            {
                name: "📅 Entrada",
                value: `<t:${Math.floor(guild.joinedTimestamp / 1000)}:F> (<t:${Math.floor(guild.joinedTimestamp / 1000)}:R>)`,
                inline: true
            }
        ],
        footer: {
            text: "Painel de Desenvolvedor • BasicFlow Core"
        }
    };

    return {
        type: 17, // Componente V2
        body: {
            embeds: [embed],
            components: [
                {
                    type: 1, // Action Row de Ações Críticas
                    components: [
                        {
                            type: 2,
                            style: 4, // DANGER (Vermelho)
                            label: "FORCE LEAVE (Sair)",
                            custom_id: `dev_guild_force_leave_${guild.id}`, // ID Dinâmico
                            emoji: { name: "🚪" }
                        },
                        {
                            type: 2,
                            style: 2, // SECONDARY (Cinza)
                            label: "Enviar DM pro Dono",
                            custom_id: `dev_guild_send_dm_${guild.id}`,
                            emoji: { name: "📨" }
                        },
                        {
                            type: 2,
                            style: 2, // SECONDARY
                            label: "Inspecionar Atividade",
                            custom_id: `dev_guild_inspect_activity_${guild.id}`, // Futuro: ver logs recentes
                            emoji: { name: "📜" },
                            disabled: true // Habilitar quando tiver sistema de logs globais pronto
                        }
                    ]
                },
                {
                    type: 1, // Action Row de Configurações
                    components: [
                        {
                            type: 2,
                            style: 1, // PRIMARY (Azul)
                            label: "Resetar Configurações",
                            custom_id: `dev_guild_reset_settings_${guild.id}`,
                            emoji: { name: "⚙️" }
                        },
                        {
                            type: 2,
                            style: 1, // PRIMARY
                            label: "Alternar Status Premium (Fake)",
                            custom_id: `dev_guild_toggle_status_${guild.id}`, // Handler a criar se necessário
                            emoji: { name: "💎" },
                            disabled: true
                        }
                    ]
                },
                {
                    type: 1, // Action Row de Navegação
                    components: [
                        {
                            type: 2,
                            style: 2, // SECONDARY
                            label: "Voltar para Lista",
                            custom_id: "dev_guilds_page",
                            emoji: { name: "⬅️" }
                        }
                    ]
                }
            ],
            flags: V2_FLAG | EPHEMERAL_FLAG
        }
    };
};