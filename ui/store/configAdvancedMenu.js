// Arquivo: ui/store/configAdvancedMenu.js

module.exports = function generateConfigAdvancedMenu(settings) {
    // Verificações visuais
    const logChannel = settings.store_log_channel_id ? `<#${settings.store_log_channel_id}>` : '`Não definido`';
    const publicLogChannel = settings.store_public_log_channel_id ? `<#${settings.store_public_log_channel_id}>` : '`Não definido`';
    const staffRole = settings.store_staff_role_id ? `<@&${settings.store_staff_role_id}>` : '`Não definido`';
    const clientRole = settings.store_client_role_id ? `<@&${settings.store_client_role_id}>` : '`Não definido`';
    const mpTokenStatus = settings.store_mp_token ? '✅ **Configurado**' : '❌ **Não definido**';
    const pixKeyStatus = settings.store_pix_key ? `\`${settings.store_pix_key}\`` : '`Não definida`';
    const inactivityStatus = settings.store_inactivity_monitor_enabled ? '✅ Ativo' : '❌ Desativado';
    const autoCloseHours = settings.store_auto_close_hours || 24;

    return [
        {
            type: 17, // Rich Layout
            accent_color: 0x5865F2,
            components: [
                { type: 10, content: "## ⚙️ Configurações Avançadas da Loja" },
                { type: 10, content: "> Ajuste logs, cargos, pagamentos e automações." },
                { type: 14, divider: true, spacing: 1 },
                
                // Bloco de Logs e Cargos (Convertido para Texto Markdown para evitar erro de limite)
                { 
                    type: 10, 
                    content: `### 📋 Registros e Permissões\n**📝 Canal de Logs:** ${logChannel}\n**📢 Logs Públicos:** ${publicLogChannel}\n**👮 Cargo Staff:** ${staffRole}\n**👤 Cargo Cliente:** ${clientRole}`
                },
                { type: 14, divider: true, spacing: 1 },

                // Bloco de Pagamento e Automação (Convertido para Texto Markdown)
                { 
                    type: 10, 
                    content: `### 💳 Financeiro e Automação\n**💳 Token MP:** ${mpTokenStatus}\n**💠 Chave PIX:** ${pixKeyStatus}\n**💤 Monitor Inatividade:** ${inactivityStatus}\n**⏰ Auto-Fechar Carrinho:** ${autoCloseHours}h`
                },

                { type: 14, divider: true, spacing: 2 },

                // --- BOTÕES DE AÇÃO ---

                // Linha 1: Logs e Cargos
                {
                    type: 1,
                    components: [
                        { type: 2, style: 2, label: "Logs Privados", emoji: { name: "📝" }, custom_id: "store_set_log_channel" },
                        { type: 2, style: 2, label: "Logs Públicos", emoji: { name: "📢" }, custom_id: "store_set_public_log_channel" },
                        { type: 2, style: 2, label: "Cargo Staff", emoji: { name: "👮" }, custom_id: "store_set_staff_role" },
                        { type: 2, style: 2, label: "Cargo Cliente", emoji: { name: "👤" }, custom_id: "store_set_client_role" }
                    ]
                },

                // Linha 2: Pagamentos (Com o botão do Mercado Pago)
                {
                    type: 1,
                    components: [
                        { 
                            type: 2, 
                            style: 2, 
                            label: "Token Mercado Pago", 
                            emoji: { name: "💳" }, 
                            custom_id: "store_set_mp_token" 
                        },
                        { type: 2, style: 2, label: "Chave PIX (Manual)", emoji: { name: "💠" }, custom_id: "store_set_pix_key" }
                    ]
                },

                // Linha 3: Automação
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