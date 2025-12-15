const { calculateSessionTime } = require('../utils/pontoUtils.js');

module.exports = function generatePontoDashboard(interaction, session, status = 'ativo') {
    // Usa a lógica centralizada e robusta de cálculo
    const timeData = calculateSessionTime(session);
    
    // Configurações visuais baseadas no status
    let color = 0x2ECC71; // Verde (Ativo)
    let title = '✅ Serviço em Andamento';
    let desc = "";

    if (session.is_paused) {
        color = 0xF1C40F; // Amarelo (Pausado)
        title = '⏸️ Serviço Pausado';
        // Mostra há quanto tempo está pausado (relativo)
        desc = `**Status:** O tempo está congelado desde <t:${Math.floor(parseInt(session.last_pause_time) / 1000)}:R>. Clique em "Retomar" para continuar.`;
    }

    if (status === 'finalizado') {
        color = 0xE74C3C; // Vermelho (Finalizado)
        title = '⏹️ Serviço Finalizado';
        desc = `**Expediente encerrado.**\nTempo total registrado: \`${timeData.formatted}\``;
    }

    // Construção do Embed (JSON Puro)
    const embed = {
        title: title,
        description: desc,
        color: color,
        thumbnail: { url: interaction.user.displayAvatarURL() },
        fields: [
            { 
                name: '👤 Usuário', 
                value: `<@${session.user_id}>`, 
                inline: true 
            },
            { 
                name: '⏳ Tempo Total', 
                value: `\`${timeData.formatted}\``, 
                inline: true 
            },
            { 
                name: '📅 Início', 
                value: `<t:${Math.floor(parseInt(session.start_time) / 1000)}:f>`, 
                inline: false 
            }
        ],
        footer: { 
            text: 'Sistema de Ponto • BasicFlow', 
            icon_url: interaction.client.user.displayAvatarURL() 
        },
        timestamp: new Date().toISOString()
    };

    // Construção dos Botões (JSON Puro - Type 1 & 2)
    const components = [];

    if (status !== 'finalizado') {
        const buttons = [];
        
        // Botão 1: Pausar ou Retomar
        if (session.is_paused) {
            buttons.push({
                type: 2, // Button
                style: 3, // Success (Verde) -> Chama atenção para voltar
                label: 'Retomar Serviço',
                custom_id: 'ponto_resume_service',
                emoji: { name: '▶️' }
            });
        } else {
            buttons.push({
                type: 2, // Button
                style: 2, // Secondary (Cinza)
                label: 'Pausar',
                custom_id: 'ponto_pause_service',
                emoji: { name: '⏸️' }
            });
        }

        // Botão 2: Finalizar
        buttons.push({
            type: 2, // Button
            style: 4, // Danger (Vermelho)
            label: 'Finalizar',
            custom_id: 'ponto_end_service',
            emoji: { name: '⏹️' }
        });

        // Botão 3: Meu Status (NOVO)
        buttons.push({
            type: 2, // Button
            style: 1, // Primary (Azul)
            label: 'Meu Status',
            custom_id: 'ponto_meu_status',
            emoji: { name: '🔄' }
        });

        // Adiciona a ActionRow com os botões
        components.push({
            type: 1, // ActionRow
            components: buttons
        });
    }

    // Retorna o payload completo compatível com update/reply
    return {
        content: "",
        embeds: [embed],
        components: components,
        flags: 1 << 6 // EPHEMERAL_FLAG (Garante que é efêmero se for novo envio)
    };
};