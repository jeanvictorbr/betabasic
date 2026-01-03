// File: ui/utilities/containerBuilderPanel.js
const { V2_FLAG } = require('../../utils/constants');

module.exports = (data) => {
    // Estado inicial padrão
    const state = data || {
        accent_color: 0x5865F2, // Blurple (Padrão Discord)
        items: [
            { type: 'header', content: 'Novo Container V2' },
            { type: 'text', content: 'Este é um texto dentro do container. A barra lateral tem a cor definida.' }
        ]
    };

    // Constrói os componentes DENTRO do Container de Preview
    const containerComponents = state.items.map(item => {
        if (item.type === 'header') {
            return { type: 10, content: `## ${item.content}` }; // Markdown de Título
        }
        if (item.type === 'text') {
            return { type: 10, content: item.content || "⠀" }; // Texto normal (com proteção de vazio)
        }
        if (item.type === 'spacer') {
            return { type: 10, content: "⠀" }; // Espaço invisível válido
        }
        if (item.type === 'divider') {
            return { type: 10, content: "─────────────────────────" };
        }
        if (item.type === 'image' && item.url) {
            // Tenta adicionar como texto de link (o Discord renderiza o preview)
            // Ou se a API suportar, aqui entraria o componente de Media (Type 12/etc)
            return { type: 10, content: `🖼️ **Imagem:** ${item.url}` };
        }
        return { type: 10, content: "⠀" };
    });

    // O CONTAINER V2 (Type 9)
    const previewContainer = {
        type: 9, // Container Component
        accent_color: state.accent_color, // ✅ AQUI ESTÁ A COR DA BARRA LATERAL
        components: containerComponents.length > 0 ? containerComponents : [{ type: 10, content: "⠀" }]
    };

    return {
        type: 17, // Mensagem V2
        body: {
            type: 1,
            flags: V2_FLAG,
            components: [
                { type: 10, content: "🛠️ **Construtor de Containers V2**\nAdicione elementos e personalize abaixo." },
                { type: 10, content: "─────────────────────────" },
                
                // --- O PREVIEW É ESTE COMPONENTE ---
                previewContainer,
                // -----------------------------------

                { type: 10, content: "─────────────────────────" },
                
                // Menu de Adição (Emojis Unicode Válidos)
                {
                    type: 1,
                    components: [{
                        type: 3, // String Select
                        custom_id: "util_cb_add_select",
                        placeholder: "➕ Adicionar Elemento...",
                        options: [
                            { label: "Título (##)", value: "add_header", description: "Texto grande.", emoji: { name: "🔹" } },
                            { label: "Texto Normal", value: "add_text", description: "Parágrafo comum.", emoji: { name: "📄" } },
                            { label: "Divisória", value: "add_divider", description: "Linha visual.", emoji: { name: "➖" } },
                            { label: "Espaço", value: "add_spacer", description: "Pula uma linha.", emoji: { name: "⬛" } },
                            { label: "Imagem (URL)", value: "add_image", description: "Link de imagem.", emoji: { name: "🖼️" } }
                        ]
                    }]
                },
                // Menu de Ações Principais
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