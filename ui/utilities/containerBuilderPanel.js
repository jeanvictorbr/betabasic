// File: ui/utilities/containerBuilderPanel.js
const { V2_FLAG } = require('../../utils/constants');

module.exports = (data) => {
    // Estado inicial se estiver vazio
    const state = data || {
        items: [
            { type: 'header', content: 'Título do Container' },
            { type: 'text_bar', content: 'Este texto tem uma barra lateral simulada usando Markdown.\nFica parecendo um embed moderno.' }
        ]
    };

    // Constrói os componentes visuais baseados na lista de itens
    const previewComponents = state.items.map((item, index) => {
        if (item.type === 'header') {
            return { type: 10, content: `## ${item.content}` }; // Markdown de Título Grande
        }
        if (item.type === 'text_bar') {
            return { type: 10, content: `> ${item.content}` }; // Markdown de Barra Lateral (Blockquote)
        }
        if (item.type === 'text_raw') {
            return { type: 10, content: item.content }; // Texto normal
        }
        if (item.type === 'divider') {
            return { type: 10, content: "─────────────────────────" }; // Divisória Visual
        }
        if (item.type === 'spacer') {
            return { type: 10, content: " " }; // Espaço vazio
        }
        if (item.type === 'image' && item.url) {
            // Nota: Imagens em V2 são tratadas como attachments ou links, 
            // aqui simulamos a linha da imagem ou usamos o recurso de MessageFlag se suportado.
            // Para simplicidade visual no preview de texto:
            return { type: 10, content: `🖼️ **[Imagem Anexada]**\n(${item.url})` };
        }
        return { type: 10, content: `[Item Desconhecido]` };
    });

    // Adiciona limites para não quebrar a API (max 10 componentes por mensagem no preview)
    const safePreview = previewComponents.slice(0, 8); 

    return {
        type: 17,
        body: {
            type: 1,
            flags: V2_FLAG,
            components: [
                { type: 10, content: "🛠️ **Construtor de Containers V2 (Geração 2.0)**\nAdicione elementos usando o menu abaixo." },
                { type: 10, content: " " }, // Espaço
                
                // --- ÁREA DE PREVIEW ---
                ...safePreview,
                // -----------------------

                { type: 10, content: " " },
                { type: 10, content: "⚙️ **Controles de Edição**" },
                
                // Menu de Adicionar Componentes
                {
                    type: 1,
                    components: [{
                        type: 3, // String Select
                        custom_id: "util_cb_add_select",
                        placeholder: "➕ Adicionar Elemento ao Container...",
                        options: [
                            { label: "Título Grande (##)", value: "add_header", description: "Texto grande e em negrito.", emoji: { name: "Tb" } },
                            { label: "Texto com Barra (>)", value: "add_text_bar", description: "Simula a barra lateral de citação.", emoji: { name: "▎" } },
                            { label: "Texto Normal", value: "add_text_raw", description: "Texto simples sem formatação.", emoji: { name: "📄" } },
                            { label: "Divisória", value: "add_divider", description: "Linha separadora.", emoji: { name: "➖" } },
                            { label: "Espaço em Branco", value: "add_spacer", description: "Pula uma linha.", emoji: { name: "⬛" } },
                            { label: "Imagem (URL)", value: "add_image", description: "Adiciona uma imagem via Link.", emoji: { name: "🖼️" } }
                        ]
                    }]
                },
                
                // Menu de Ações (Limpar/Remover Último)
                {
                    type: 1,
                    components: [
                        { type: 2, style: 2, label: "Remover Último", emoji: { name: "↩️" }, custom_id: "util_cb_undo" },
                        { type: 2, style: 4, label: "Limpar Tudo", emoji: { name: "🗑️" }, custom_id: "util_cb_clear" },
                        { type: 2, style: 3, label: "Enviar Container", emoji: { name: "🚀" }, custom_id: "util_cb_send" },
                        { type: 2, style: 2, label: "Voltar", emoji: { name: "⬅️" }, custom_id: "config_open_utilities" }
                    ]
                }
            ]
        }
    };
};