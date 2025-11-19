// File: ui/registros/oauthHubMenu.js
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants.js');

function getOAuthHubMenu(settings) {

    // --- NOVO SISTEMA DE AUTH (Integração) ---
    // Pega a URL que definimos no .env (porta 8080 da Discloud)
    const authSystemUrl = process.env.AUTH_SYSTEM_URL;
    const isConnected = !!authSystemUrl;
    const systemStatus = isConnected ? '🟢 Conectado' : '🔴 Não Configurado (.env)';

    // --- SISTEMA ANTIGO / VITRINE ---
    const roleId = settings.cloudflow_verify_role_id;
    const channelId = settings.cloudflow_verify_channel_id;
    const messageId = settings.cloudflow_verify_message_id;
    const showcaseStatus = roleId && channelId && messageId ? '🟢 Ativa' : '🟡 Incompleta';

    const v2_components = [
        { "type": 10, "content": "## 🛡️ Sistema de Auth 2.0 (Backend Externo)" },
        { "type": 10, "content": "> Painel de controle integrado ao novo sistema de OAuth2 (PostgreSQL)." },
        { "type": 14, "divider": true, "spacing": 2 },

        // --- ITEM 1: STATUS DO BACKEND & TESTE ---
        {
            "type": 9,
            "accessory": { 
                "type": 2, 
                "style": 5, // Style 5 = Link Button
                "label": "Testar Login", 
                "emoji": { "name": "🔗" }, 
                "url": isConnected ? `${authSystemUrl}/login` : "https://discord.com",
                "disabled": !isConnected
            },
            "components": [
                { "type": 10, "content": "### Status da API (Porta 8080)" },
                { "type": 10, "content": `> Conexão com o app externo.\n> **Estado:** ${systemStatus}` }
            ]
        },
        { "type": 14, "divider": true, "spacing": 1 },

        // --- ITEM 2: FORÇAR ENTRADA (SEU FOCO PRINCIPAL) ---
        {
            "type": 9,
            "accessory": { 
                "type": 2, 
                "style": 1, // Style 1 = Primary (Blurple)
                "label": "Forçar Entrada", 
                "emoji": { "name": "🚀" }, 
                "custom_id": "oauth_force_join_check", // Handler que criamos para chamar a API /api/join
                "disabled": !isConnected
            },
            "components": [
                { "type": 10, "content": "### Force Join (Adicionar Membro)" },
                { "type": 10, "content": "> **Prioridade:** Adicione um membro ao servidor forçadamente utilizando o token salvo no banco de dados." }
            ]
        },
        { "type": 14, "divider": true, "spacing": 1 },

        // --- ITEM 3: GERENCIADOR (MANTIDO) ---
        {
            "type": 9,
            "accessory": { "type": 2, "style": 2, "label": "Gerenciar", "emoji": { "name": "👥" }, "custom_id": "aut_oauth_manage_members" },
            "components": [
                { "type": 10, "content": "### Gerenciador de Membros" },
                { "type": 10, "content": "> Veja, remova, bana ou transfira membros que já se verificaram." }
            ]
        },
        { "type": 14, "divider": true, "spacing": 1 },

        // --- ITEM 4: VITRINE (MANTIDO) ---
        {
            "type": 9,
            "accessory": { "type": 2, "style": 2, "label": "Configurar", "emoji": { "name": "🎨" }, "custom_id": "aut_oauth_config_showcase" },
            "components": [
                { "type": 10, "content": "### Vitrine de Verificação" },
                { "type": 10, "content": `> Configure a aparência da mensagem pública e o cargo.\n> **Status da Vitrine:** ${showcaseStatus}` }
            ]
        },
        { "type": 14, "divider": true, "spacing": 2 },
        
        // --- RODAPÉ: VOLTAR ---
        {
            "type": 1, "components": [
                { "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "⬅️" }, "custom_id": "aut_reg_back_to_registros" }
            ]
        }
    ];

    return {
        type: 17,
        flags: V2_FLAG | EPHEMERAL_FLAG,
        accent_color: 0x10B981, // Verde Esmeralda (Indica Sucesso/Novo Sistema)
        components: v2_components
    };
}

module.exports = { getOAuthHubMenu };