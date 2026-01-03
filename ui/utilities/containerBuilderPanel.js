// File: ui/utilities/containerBuilderPanel.js
const { V2_FLAG } = require('../../utils/constants');

module.exports = (data) => {
    // Estado inicial padrão
    const state = data || {
        accent_color: 0x5865F2, // Blurple
        items: [
            { type: 'header', content: 'Novo Container' },
            { type: 'text', content: 'Este container possui barra lateral colorida.' }
        ]
    };

    // 1. Construção dos componentes de texto internos
    const internalComponents = state.items.map(item => {
        if (item.type === 'header') return { type: 10, content: `## ${item.content}` };
        if (item.type === 'text') return { type: 10, content: item.content || "⠀" };
        if (item.type === 'divider') return { type: 10, content: "─────────────────────────" };
        if (item.type === 'spacer') return { type: 10, content: "⠀" };
        if (item.type === 'image') return { type: 10, content: `🖼️ **Imagem:** ${item.url}` };
        return { type: 10, content: "⠀" };
    });

    // 2. O CONTAINER V2 (Type 9)
    const previewContainer = {
        type: 9, 
        accent_color: state.accent_color, // Cor da barra lateral
        // ✅ CORREÇÃO: O 'accessory' é OBRIGATÓRIO na API.
        // Adicionamos um botão 'dummy' desativado para cumprir a regra.
        accessory: {
            type: 2, 
            style: 2, // Secondary (Cinza)
            label: "Container",
            custom_id: "dummy_preview_btn",
            disabled: true 
        },
        components: internalComponents.length > 0 ? internalComponents : [{ type: 10, content: "⠀" }]
    };

    return {
        type: 17, 
        body: {
            type: 1,
            flags: V2_FLAG,
            components: [
                { type: 10, content: "🛠️ **Editor de Containers V2**" },
                { type: 10, content: "─────────────────────────" },
                
                // O PREVIEW
                previewContainer,
                
                { type: 10, content: "─────────────────────────" },
                
                // Menu de Adição
                {
                    type: 1,
                    components: [{
                        type: 3, 
                        custom_id: "util_cb_add_select",
                        placeholder: "➕ Adicionar Elemento...",
                        options: [
                            { label: "Título (##)", value: "add_header", emoji: { name: "🔹" } },
                            { label: "Texto Normal", value: "add_text", emoji: { name: "📄" } },
                            { label: "Divisória", value: "add_divider", emoji: { name: "➖" } },
                            { label: "Espaço", value: "add_spacer", emoji: { name: "⬛" } },
                            { label: "Imagem (URL)", value: "add_image", emoji: { name: "🖼️" } }
                        ]
                    }]
                },
                // Menu de Ações
                {
                    type: 1,
                    components: [
                        { type: 2, style: 2, label: "Mudar Cor", emoji: { name: "🎨" }, custom_id: "util_cb_color" },
                        { type: 2, style: 2, label: "Desfazer", emoji: { name: "↩️" }, custom_id: "util_cb_undo" },
                        { type: 2, style: 4, label: "Limpar", emoji: { name: "🗑️" }, custom_id: "util_cb_clear" },
                        { type: 2, style: 3, label: "Enviar", emoji: { name: "🚀" }, custom_id: "util_cb_send" },
                        { type: 2, style: 2, label: "Sair", emoji: { name: "✖️" }, custom_id: "delete_ephemeral_reply" }
                    ]
                }
            ]
        }
    };
};