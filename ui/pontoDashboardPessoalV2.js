const { calculateSessionTime } = require('../utils/pontoUtils.js');

module.exports = (session, member) => {
    const timeData = calculateSessionTime(session);
    
    // Cores e Status Visuais
    let color = 0x00FF00; // Verde (Trabalhando)
    let statusText = "🟢 Em Serviço";
    let statusDescription = "Você está contabilizando horas atualmente.";

    if (session.is_paused) {
        color = 0xFFFF00; // Amarelo
        statusText = "⏸️ Pausado";
        statusDescription = "Seu tempo está pausado. Clique em **Retomar** para continuar.";
    }

    // Botões
    const components = [
        {
            type: 1, // Action Row
            components: [
                {
                    type: 2, // Button
                    style: session.is_paused ? 3 : 2, // Verde se pausado, Cinza se trabalhando
                    label: session.is_paused ? "Retomar Serviço" : "Pausar Serviço",
                    custom_id: session.is_paused ? "ponto_resume_service" : "ponto_pause_service",
                    emoji: session.is_paused ? { name: "▶️" } : { name: "⏸️" }
                },
                {
                    type: 2, // Button
                    style: 4, // Danger (Vermelho)
                    label: "Encerrar Expediente",
                    custom_id: "ponto_end_service",
                    emoji: { name: "🛑" }
                },
                {
                    type: 2, // Button
                    style: 1, // Primary (Azul)
                    label: "Atualizar Painel",
                    custom_id: "ponto_meu_status",
                    emoji: { name: "🔄" }
                }
            ]
        }
    ];

    // 🔴 CORREÇÃO DA DM AQUI: 
    // Se for DM, puxa o nome e o avatar do usuário. Se for no servidor, puxa o ícone da Guild.
    const displayName = member.displayName || member.username || 'Funcionário';
    const safeIconUrl = member.guild ? member.guild.iconURL() : member.displayAvatarURL();

    return {
        content: "",
        embeds: [
            {
                title: `Painel de Ponto: ${displayName}`,
                description: statusDescription,
                color: color,
                fields: [
                    {
                        name: "⏱️ Tempo Decorrido",
                        value: `\`${timeData.formatted}\``,
                        inline: true
                    },
                    {
                        name: "📊 Status Atual",
                        value: `**${statusText}**`,
                        inline: true
                    },
                    {
                        name: "📅 Início da Sessão",
                        value: `<t:${timeData.startTimestamp}:f> (<t:${timeData.startTimestamp}:R>)`,
                        inline: false
                    }
                ],
                footer: {
                    text: "Koda Time Tracking • Stable",
                    icon_url: safeIconUrl // Agora é 100% seguro contra DMs!
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: components,
        flags: 1 << 6 // EPHEMERAL
    };
};