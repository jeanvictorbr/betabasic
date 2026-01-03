// File: ui/utilities/containerBuilderPanel.js
const { V2_FLAG } = require('../../utils/constants');

module.exports = (data) => {
    // Estado inicial se estiver vazio
    const state = data || {
        items: [
            { type: 'header', content: 'Título do Container' },
            { type: 'text_bar', content: 'Este texto tem uma barra lateral simulada.\nÉ o estilo mais próximo de Embed na V2.' }
        ]
    };

    // Constrói os componentes visuais do PREVIEW
    const previewComponents = state.items.map((item, index) => {
        if (item.type === 'header') {
            return { type: 10, content: `## ${item.content}` }; // Markdown Título
        }
        if (item.type === 'text_bar') {
            // O "> " cria a barra lateral cinza (Blockquote)
            return { type: 10, content: `> ${item.content}` }; 
        }
        if (item.type === 'text_raw') {
            return { type: 10, content: item.content || "⠀" }; 
        }
        if (item.type === 'divider') {
            return { type: 10, content: "─────────────────────────" };
        }
        if (item.type === 'spacer') {
            return { type: 10, content: "⠀" }; // Caractere vazio válido
        }
        if (item.type === 'image' && item.url) {
            // Exibe o link da imagem (o Discord renderiza o preview abaixo automaticamente)
            return { type: 10, content: item.url };
        }
        return { type: 10, content: `[Item Inválido]` };
    });

    // Limite de segurança para preview (max 10 itens para não estourar a mensagem)
    const safePreview = previewComponents.slice(0, 8); 

    return {
        type: 17,
        body: {
            type: 1,
            flags: V2_FLAG,
            components: [
                { type: 10, content: "🛠️ **Construtor de Containers V2**" },
                { type: 10, content: "─────────────────────────" }, // Separador visual fixo
                
                // --- ÁREA DE PREVIEW DINÂMICO ---
                ...safePreview,
                // --------------------------------

                { type: 10, content: "─────────────────────────" },
                
                // Menu de Adicionar Componentes (EMOJIS CORRIGIDOS)
                {
                    type: 1,
                    components: [{
                        type: 3, // String Select
                        custom_id: "util_cb_add_select",
                        placeholder: "➕ Adicionar Elemento...",
                        options: [
                            { 
                                label: "Título Grande (##)", 
                                value: "add_header", 
                                description: "Texto grande em negrito.", 
                                emoji: { name: "🔹" } // Unicode válido
                            },
                            { 
                                label: "Texto com Barra (>)", 
                                value: "add_text_bar", 
                                description: "Simula o visual de Embed/Citação.", 
                                emoji: { name: "🗨️" } // Unicode válido
                            },
                            { 
                                label: "Texto Normal", 
                                value: "add_text_raw", 
                                description: "Texto simples.", 
                                emoji: { name: "📄" } 
                            },
                            { 
                                label: "Divisória", 
                                value: "add_divider", 
                                description: "Linha separadora.", 
                                emoji: { name: "➖" } 
                            },
                            { 
                                label: "Espaço em Branco", 
                                value: "add_spacer", 
                                description: "Pula uma linha.", 
                                emoji: { name: "⬛" } 
                            },
                            { 
                                label: "Imagem (URL)", 
                                value: "add_image", 
                                description: "Link de imagem.", 
                                emoji: { name: "🖼️" } 
                            }
                        ]
                    }]
                },
                
                // Menu de Ações
                {
                    type: 1,
                    components: [
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