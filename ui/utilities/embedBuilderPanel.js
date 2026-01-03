// File: ui/utilities/embedBuilderPanel.js
module.exports = (currentEmbed) => {
    // Estado inicial padrão se nenhum embed for passado
    const previewEmbed = currentEmbed || {
        title: "Título do Container",
        description: "Este é um exemplo de descrição.\nClique nos botões abaixo para editar cada parte.",
        color: 0x5865F2, // Blurple
        footer: { text: "BasicFlow Builder" }
    };

    return {
        // MENSAGEM PADRÃO (Sem V2_FLAG para permitir Embeds)
        content: "🛠️ **Editor de Containers**\nEdite o conteúdo e veja o resultado em tempo real abaixo.",
        embeds: [previewEmbed],
        components: [
            {
                type: 1, // ActionRow 1: Texto e Cor
                components: [
                    { type: 2, style: 2, label: "Editar Título", emoji: { name: "📝" }, custom_id: "util_eb_edit_title" },
                    { type: 2, style: 2, label: "Editar Descrição", emoji: { name: "📄" }, custom_id: "util_eb_edit_description" },
                    { type: 2, style: 2, label: "Alterar Cor", emoji: { name: "🎨" }, custom_id: "util_eb_edit_color" }
                ]
            },
            {
                type: 1, // ActionRow 2: Imagens e Rodapé
                components: [
                    { type: 2, style: 2, label: "Imagem Grande", emoji: { name: "🖼️" }, custom_id: "util_eb_edit_image" },
                    { type: 2, style: 2, label: "Thumbnail", emoji: { name: "📷" }, custom_id: "util_eb_edit_thumbnail" },
                    { type: 2, style: 2, label: "Autor/Rodapé", emoji: { name: "👤" }, custom_id: "util_eb_edit_meta" }
                ]
            },
            {
                type: 1, // ActionRow 3: Campos (Fields)
                components: [
                    { type: 2, style: 1, label: "Add Campo", emoji: { name: "➕" }, custom_id: "util_eb_field_add" },
                    { type: 2, style: 2, label: "Remover Último", emoji: { name: "➖" }, custom_id: "util_eb_field_rem" },
                    { type: 2, style: 4, label: "Limpar Tudo", emoji: { name: "🗑️" }, custom_id: "util_eb_clear_all" }
                ]
            },
            {
                type: 1, // ActionRow 4: Navegação
                components: [
                    { type: 2, style: 3, label: "Enviar para Canal", emoji: { name: "🚀" }, custom_id: "util_eb_send_start" },
                    { type: 2, style: 2, label: "Voltar", emoji: { name: "⬅️" }, custom_id: "config_open_utilities" }
                ]
            }
        ]
    };
};