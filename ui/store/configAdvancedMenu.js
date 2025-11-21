// Arquivo: ui/store/configAdvancedMenu.js

module.exports = function generateConfigAdvancedMenu(settings) {
    // Verificações visuais (Mantendo sua lógica original)
    const logChannel = settings.store_log_channel_id ? `<#${settings.store_log_channel_id}>` : '`Não definido`';
    const publicLogChannel = settings.store_public_log_channel_id ? `<#${settings.store_public_log_channel_id}>` : '`Não definido`';
    const staffRole = settings.store_staff_role_id ? `<@&${settings.store_staff_role_id}>` : '`Não definido`';
    const clientRole = settings.store_client_role_id ? `<@&${settings.store_client_role_id}>` : '`Não definido`';
    
    // Status visual do Token MP
    const mpTokenStatus = settings.store_mp_token ? '✅ **Configurado**' : '❌ **Não definido**';
    
    const pixKeyStatus = settings.store_pix_key ? `\`${settings.store_pix_key}\`` : '`Não definida`';
    const inactivityStatus = settings.store_inactivity_monitor_enabled ? '✅ Ativo' : '❌ Desativado';
    const autoCloseHours = settings.store_auto_close_hours || 24;

    return [
        {
            type: 17, // Rich Layout (V2)
            accent_color: 0x5865F2,
            components: [
                { type: 10, content: "## ⚙️ Configurações Avançadas da Loja" },
                { type: 10, content: "> Ajuste logs, cargos, pagamentos e automações." },
                { type: 14, divider: true, spacing: 1 },
                
                // Bloco de Resumo (Info)
                { 
                    type: 9, // Lista
                    components: [
                        { type: 10, content: `**📝 Canal de Logs:** ${logChannel}` },
                        { type: 10, content: `**📢 Logs Públicos:** ${publicLogChannel}` },
                        { type: 10, content: `**👮 Cargo Staff:** ${staffRole}` },
                        { type: 10, content: `**👤 Cargo Cliente:** ${clientRole}` }
                    ]
                },
                { type: 14, divider: true, spacing: 1 },

                // Bloco de Pagamento e Automação
                { 
                    type: 9, 
                    components: [
                        { type: 10, content: `**💳 Token MP:** ${mpTokenStatus}` }, // Mostra status do Token
                        { type: 10, content: `**💠 Chave PIX:** ${pixKeyStatus}` },
                        { type: 10, content: `**💤 Monitor Inatividade:** ${inactivityStatus}` },
                        { type: 10, content: `**⏰ Auto-Fechar Carrinho:** ${autoCloseHours}h` }
                    ]
                },

                { type: 14, divider: true, spacing: 2 },

                // Linha 1: Botões de Logs e Cargos
                {
                    type: 1,
                    components: [
                        { type: 2, style: 2, label: "Logs Privados", emoji: { name: "📝" }, custom_id: "store_set_log_channel" },
                        { type: 2, style: 2, label: "Logs Públicos", emoji: { name: "📢" }, custom_id: "store_set_public_log_channel" },
                        { type: 2, style: 2, label: "Cargo Staff", emoji: { name: "👮" }, custom_id: "store_set_staff_role" },
                        { type: 2, style: 2, label: "Cargo Cliente", emoji: { name: "👤" }, custom_id: "store_set_client_role" }
                    ]
                },

                // Linha 2: Pagamentos (AQUI ESTÁ O BOTAO QUE FALTAVA)
                {
                    type: 1,
                    components: [
                        { 
                            type: 2, 
                            style: 2, // Secondary (Cinza) ou 1 (Azul) se preferir destaque
                            label: "Token Mercado Pago", 
                            emoji: { name: "💳" }, 
                            custom_id: "store_set_mp_token" // Handler para configurar o token
                        },
                        { type: 2, style: 2, label: "Chave PIX (Manual)", emoji: { name: "💠" }, custom_id: "store_set_pix_key" }
                    ]
                },

                // Linha 3: Automação e Voltar
                {
                    type: 1,
                    components: [
                        { type: 2, style: isEnabledStyle(settings.store_inactivity_monitor_enabled), label: "Monitor Inatividade", emoji: { name: "💤" }, custom_id: "store_toggle_inactivity_monitor" },
                        { type: 2, style: 2, label: "Tempo Auto-Fechar", emoji: { name: "⏰" }, custom_id: "store_set_auto_close" },
                        { type: 2, style: 2, label: "Voltar", emoji: { name: "↩️" }, custom_id: "store_config_main" }
                    ]
                }
            ]
        }
    ];
};

function isEnabledStyle(bool) {
    return bool ? 3 : 4; // 3 = Green (Success), 4 = Red (Danger)
}