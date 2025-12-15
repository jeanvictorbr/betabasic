const { calculateSessionTime } = require('../utils/pontoUtils.js');

module.exports = (session, member) => {
    const timeData = calculateSessionTime(session);
    
    let color = 0x00FF00;
    let statusText = "🟢 Em Serviço";
    let statusDescription = "Você está contabilizando horas atualmente.";

    // Garante que start_time seja convertido para Timestamp Unix (segundos) para o Discord
    const startTimeDate = session.start_time instanceof Date ? session.start_time : new Date(session.start_time);
    const startTimestamp = Math.floor(startTimeDate.getTime() / 1000);

    if (session.is_paused) {
        color = 0xFFFF00;
        statusText = "⏸️ Pausado";
        statusDescription = "Seu tempo está pausado. Clique em **Retomar** para continuar.";
    }

    const components = [
        {
            type: 1, 
            components: [
                {
                    type: 2, 
                    style: session.is_paused ? 3 : 2, 
                    label: session.is_paused ? "Retomar Serviço" : "Pausar Serviço",
                    custom_id: session.is_paused ? "ponto_resume_service" : "ponto_pause_service",
                    emoji: session.is_paused ? { name: "▶️" } : { name: "⏸️" }
                },
                {
                    type: 2, 
                    style: 4, 
                    label: "Encerrar Expediente",
                    custom_id: "ponto_end_service",
                    emoji: { name: "🛑" }
                },
                {
                    type: 2, 
                    style: 1, 
                    label: "Atualizar Painel",
                    custom_id: "ponto_meu_status",
                    emoji: { name: "🔄" }
                }
            ]
        }
    ];

    return {
        content: "",
        embeds: [
            {
                title: `Painel de Ponto: ${member.displayName}`,
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
                        value: `<t:${startTimestamp}:R>`, // Corrigido para timestamp válido
                        inline: false
                    }
                ],
                footer: {
                    text: "BasicFlow Time Tracking • V3.1 Stability Update",
                    icon_url: member.guild.iconURL()
                },
                timestamp: new Date().toISOString()
            }
        ],
        components: components,
        flags: 1 << 6
    };
};