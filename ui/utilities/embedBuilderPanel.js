// File: ui/utilities/embedBuilderPanel.js
const { V2_FLAG } = require('../../utils/constants');

module.exports = (currentEmbed) => {
    // Garante que o embed seja um objeto válido para visualização
    const previewEmbed = currentEmbed || {
        title: "Título do Embed",
        description: "Esta é a descrição do seu embed. Clique nos botões abaixo para editar.",
        color: 0x2B2D31, // Cor padrão escura
    };

    return {
        type: 17,
        body: {
            type: 1,
            flags: V2_FLAG,
            content: "🎨 **Criador de Interfaces V2**\nEdite o embed abaixo usando os botões. O resultado é atualizado em tempo real.",
            // O Preview fica aqui nos embeds da mensagem
            embeds: [previewEmbed],
            components: [
                {
                    type: 1, // Linha 1: Conteúdo Principal
                    components: [
                        { type: 2, style: 2, label: "Editar Título", emoji: { name: "📝" }, custom_id: "util_eb_edit_title" },
                        { type: 2, style: 2, label: "Editar Descrição", emoji: { name: "📄" }, custom_id: "util_eb_edit_description" },
                        { type: 2, style: 2, label: "Alterar Cor", emoji: { name: "🎨" }, custom_id: "util_eb_edit_color" }
                    ]
                },
                {
                    type: 1, // Linha 2: Mídia e Autor
                    components: [
                        { type: 2, style: 2, label: "Definir Imagem", emoji: { name: "🖼️" }, custom_id: "util_eb_edit_image" },
                        { type: 2, style: 2, label: "Thumbnail", emoji: { name: "📷" }, custom_id: "util_eb_edit_thumbnail" },
                        { type: 2, style: 2, label: "Autor/Rodapé", emoji: { name: "👤" }, custom_id: "util_eb_edit_meta" }
                    ]
                },
                {
                    type: 1, // Linha 3: Campos (Fields)
                    components: [
                        { type: 2, style: 1, label: "Adicionar Campo", emoji: { name: "➕" }, custom_id: "util_eb_field_add" },
                        { type: 2, style: 4, label: "Remover Último Campo", emoji: { name: "➖" }, custom_id: "util_eb_field_rem" },
                        { type: 2, style: 2, label: "Limpar Tudo", emoji: { name: "🗑️" }, custom_id: "util_eb_clear_all" }
                    ]
                },
                {
                    type: 1, // Linha 4: Ação Final
                    components: [
                        { type: 2, style: 3, label: "Enviar para Canal", emoji: { name: "🚀" }, custom_id: "util_eb_send_start" },
                        { type: 2, style: 2, label: "Voltar", emoji: { name: "⬅️" }, custom_id: "config_open_utilities" }
                    ]
                }
            ]
        }
    };
};