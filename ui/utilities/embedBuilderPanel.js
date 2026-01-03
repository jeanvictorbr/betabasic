// File: ui/utilities/embedBuilderPanel.js
module.exports = (currentEmbed) => {
    const previewEmbed = currentEmbed || {
        title: "Título do Container",
        description: "Descrição padrão.",
        color: 0x5865F2
    };

    return {
        // Mensagem padrão (suporta embeds)
        content: "🛠️ **Editor de Containers**\nUse os botões para editar. O resultado aparece abaixo em tempo real.",
        embeds: [previewEmbed],
        components: [
            {
                type: 1, 
                components: [
                    { type: 2, style: 2, label: "Editar Título", emoji: { name: "📝" }, custom_id: "util_eb_edit_title" },
                    { type: 2, style: 2, label: "Editar Descrição", emoji: { name: "📄" }, custom_id: "util_eb_edit_description" },
                    { type: 2, style: 2, label: "Alterar Cor", emoji: { name: "🎨" }, custom_id: "util_eb_edit_color" }
                ]
            },
            {
                type: 1, 
                components: [
                    { type: 2, style: 2, label: "Imagem Grande", emoji: { name: "🖼️" }, custom_id: "util_eb_edit_image" },
                    { type: 2, style: 2, label: "Thumbnail", emoji: { name: "📷" }, custom_id: "util_eb_edit_thumbnail" },
                    { type: 2, style: 2, label: "Autor/Rodapé", emoji: { name: "👤" }, custom_id: "util_eb_edit_meta" }
                ]
            },
            {
                type: 1, 
                components: [
                    { type: 2, style: 1, label: "Add Campo", emoji: { name: "➕" }, custom_id: "util_eb_field_add" },
                    { type: 2, style: 2, label: "Remover Último", emoji: { name: "➖" }, custom_id: "util_eb_field_rem" },
                    { type: 2, style: 2, label: "Limpar Tudo", emoji: { name: "🗑️" }, custom_id: "util_eb_clear_all" }
                ]
            },
            {
                type: 1, 
                components: [
                    { type: 2, style: 3, label: "Enviar para Canal", emoji: { name: "🚀" }, custom_id: "util_eb_send_start" },
                    // O botão Voltar agora fecha essa mensagem, já que ela é uma "nova janela"
                    { type: 2, style: 4, label: "Fechar Editor", emoji: { name: "✖️" }, custom_id: "delete_ephemeral_reply" }
                ]
            }
        ]
    };
};