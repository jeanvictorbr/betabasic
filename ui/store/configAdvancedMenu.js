// File: ui/store/configAdvancedMenu.js
const FEATURES = require('../../config/features.js');

module.exports = function generateStoreAdvancedConfigMenu(interaction, guildSettings) {
    
    // Verifica o status do token para exibir no texto (opcional, mas útil para feedback visual)
    const hasMpToken = guildSettings.store_mp_token ? "✅ Ativo" : "❌ Inativo";
    const hasPixKey = guildSettings.store_pix_key ? "✅ Ativa" : "❌ Inativa";
    const autoCloseHours = guildSettings.store_auto_close_hours || 24;

    return [
        {
            "type": 17,
            "components": [
                { 
                    "type": 10, 
                    "content": `## ⚙️ Configurações Avançadas da Loja\nGerencie as integrações de pagamento e automações do sistema de vendas.\n\n> **Status Atual:**\n> 💳 **Mercado Pago:** ${hasMpToken}\n> 💠 **Pix Manual:** ${hasPixKey}\n> ⏲️ **Auto-Fechar Carrinhos:** ${autoCloseHours} horas` 
                },
                { "type": 14, "divider": true, "spacing": 2 },
                
                // --- SEÇÃO DE PAGAMENTOS ---
                { "type": 10, "content": "### 💳 Integrações de Pagamento" },
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": 2, // Secondary (Cinza)
                            "label": "Configurar Token MP",
                            "emoji": { "name": "💳" },
                            "custom_id": "store_set_mp_token" // <--- BOTAO RESTAURADO AQUI
                        },
                        {
                            "type": 2,
                            "style": 2,
                            "label": "Definir Chave Pix",
                            "emoji": { "name": "💠" },
                            "custom_id": "store_set_pix_key"
                        }
                    ]
                },

                { "type": 14, "divider": true, "spacing": 2 },

                // --- SEÇÃO DE AUTOMAÇÃO ---
                { "type": 10, "content": "### 🤖 Automações e Logs" },
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": 2,
                            "label": "Logs Públicos",
                            "emoji": { "name": "📢" },
                            "custom_id": "store_set_public_log_channel"
                        },
                        {
                            "type": 2,
                            "style": 2,
                            "label": "Tempo Auto-Close",
                            "emoji": { "name": "⏲️" },
                            "custom_id": "store_set_auto_close"
                        }
                    ]
                },
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": guildSettings.store_inactivity_monitor_enabled ? 3 : 4, // Verde se ativo, Vermelho se inativo
                            "label": guildSettings.store_inactivity_monitor_enabled ? "Monitor Inatividade: ON" : "Monitor Inatividade: OFF",
                            "emoji": { "name": "💤" },
                            "custom_id": "store_toggle_inactivity_monitor"
                        },
                        {
                            "type": 2,
                            "style": guildSettings.store_premium_dm_flow_enabled ? 3 : 4,
                            "label": guildSettings.store_premium_dm_flow_enabled ? "Fluxo DM: ON" : "Fluxo DM: OFF",
                            "emoji": { "name": "💬" },
                            "custom_id": "store_toggle_dm_flow"
                        }
                    ]
                },

                { "type": 14, "divider": true, "spacing": 2 },

                // --- BOTÃO DE VOLTAR ---
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": 2,
                            "label": "Voltar para Menu Principal",
                            "emoji": { "name": "⬅️" },
                            "custom_id": "open_store_menu"
                        }
                    ]
                }
            ]
        }
    ];
};