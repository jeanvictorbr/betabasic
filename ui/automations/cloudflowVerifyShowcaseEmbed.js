// File: ui/automations/cloudflowVerifyShowcaseEmbed.js
// (MODIFICADO para ser SEMPRE V2, SEM imagem e com LINK DIRETO)

const { V2_FLAG } = require('../../utils/constants.js');

// Agora esta função gera o botão com o LINK CORRETO
function getCloudflowVerifyShowcaseEmbed(config) {
    // Puxa as configurações ou usa os pré-enchidos
    const title = config?.title || "## 🛡️ Verificação CloudFlow";
    const description = config?.description || "> Para ter acesso completo aos canais deste servidor e confirmar sua identidade, clique no botão abaixo e autorize o BasicFlow.";
    const footer = config?.footer || "Sua verificação é segura e seus dados estão protegidos.";
    
    // --- LÓGICA DO LINK ---
    // Pega a URL do .env e o ID da guilda da config
    const authUrl = process.env.AUTH_SYSTEM_URL; // Ex: https://jvverify.discloud.app
    const guildId = config?.guild_id;
    
    let buttonComponent;

    // Se tivermos a URL e o ID, criamos o Botão de Link (Mais Rápido e Seguro)
    if (authUrl && guildId) {
        buttonComponent = {
            "type": 2, // Button
            "style": 5, // 5 = Link Button
            "label": "Verificar Agora",
            "url": `${authUrl}/login?guild_id=${guildId}`, // Link direto para o Auth System
            "emoji": { "name": "🔗" }
        };
    } else {
        // Fallback de segurança se a config estiver incompleta
        buttonComponent = {
            "type": 2, 
            "style": 1, 
            "label": "Verificar (Erro de Config)",
            "custom_id": "cloudflow_start_verification", 
            "emoji": { "name": "⚠️" },
            "disabled": true
        };
    }

    // 1. ESTE É O PAYLOAD V17 (V2)
    const v17_payload = {
        type: 17,
        flags: V2_FLAG, // Flag pública
        accent_color: 0x57F287, // Verde
        components: [
            { "type": 10, "content": title },
            { "type": 10, "content": description },
            { "type": 14, "divider": true, "spacing": 2 },
            { "type": 10, "content": `> ${footer}` },
            { "type": 14, "divider": true, "spacing": 2 },
            {
                "type": 1, // Action Row
                "components": [ buttonComponent ]
            }
        ]
    };
    
    return v17_payload;
}

module.exports = { getCloudflowVerifyShowcaseEmbed };