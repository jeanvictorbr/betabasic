// File: ui/utilities/containerBuilderPanel.js
// Flags V2
const V2_FLAG = 1 << 15; 

module.exports = (data) => {
    // Estado padrão do Container
    const containerState = data || {
        accessoryLabel: "Clique Aqui",
        accessoryStyle: 1, // 1: Primary, 2: Secondary, 3: Success, 4: Danger
        title: "Título do Container",
        description: "Descrição do container V2.",
        emoji: "🚀"
    };

    // Preparação do emoji (Evita erro se for null)
    const accessoryObj = {
        type: 2, // Button Accessory
        style: containerState.accessoryStyle,
        label: containerState.accessoryLabel,
        custom_id: "preview_action_disabled",
        disabled: true // Botão de preview não faz nada
    };

    // Só adiciona a propriedade emoji se ela existir
    if (containerState.emoji) {
        accessoryObj.emoji = { name: containerState.emoji };
    }

    // Constrói o Container V2 (Type 9) para o Preview
    const previewContainer = {
        type: 9, // Container V2
        accessory: accessoryObj,
        components: [
            { type: 10, content: `**${containerState.title}**` }, // Título em Negrito
            { type: 10, content: containerState.description }      // Descrição
        ]
    };

    return {
        type: 17, // Interface V2
        body: {
            type: 1,
            flags: V2_FLAG,
            components: [
                // 1. Cabeçalho
                { type: 10, content: "🛠️ **Editor de Containers V2**\nVeja o preview abaixo e use os botões para editar." },
                
                // 2. O PREVIEW (O Container em si)
                previewContainer,
                
                // 3. Separador visual (CORRIGIDO: Texto visível para evitar erro de length)
                { type: 10, content: "─────────────────────────" }, 

                // 4. Controles de Edição
                {
                    type: 1, // Linha de Botões
                    components: [
                        { type: 2, style: 2, label: "Editar Título", emoji: { name: "📝" }, custom_id: "util_cb_edit_title" },
                        { type: 2, style: 2, label: "Editar Descrição", emoji: { name: "📄" }, custom_id: "util_cb_edit_desc" },
                        { type: 2, style: 2, label: "Botão (Acessório)", emoji: { name: "🔘" }, custom_id: "util_cb_edit_btn" }
                    ]
                },
                {
                    type: 1, // Linha de Estilo
                    components: [
                        { type: 2, style: 1, label: "Azul", custom_id: "util_cb_style_1" },
                        { type: 2, style: 2, label: "Cinza", custom_id: "util_cb_style_2" },
                        { type: 2, style: 3, label: "Verde", custom_id: "util_cb_style_3" },
                        { type: 2, style: 4, label: "Vermelho", custom_id: "util_cb_style_4" }
                    ]
                },
                {
                    type: 1, // Linha de Ação
                    components: [
                        { type: 2, style: 3, label: "Enviar Container", emoji: { name: "🚀" }, custom_id: "util_cb_send" },
                        { type: 2, style: 2, label: "Voltar", emoji: { name: "⬅️" }, custom_id: "config_open_utilities" }
                    ]
                }
            ]
        }
    };
};