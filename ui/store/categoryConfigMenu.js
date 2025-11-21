// Arquivo: ui/store/categoryConfigMenu.js
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = (categoryData) => {
    const catId = categoryData.id;
    const currentTitle = categoryData.vitrine_title || categoryData.name;
    const currentColor = categoryData.vitrine_color || 'Padrão';
    const isPublished = categoryData.vitrine_channel_id && categoryData.vitrine_message_id;

    return {
        type: 17, // Componentes V2
        body: {
            flags: EPHEMERAL_FLAG | V2_FLAG,
            content: `**🎨 Configuração de Vitrine: ${categoryData.name}**\n\nUse este painel para personalizar como esta categoria aparece para os membros.\n\n**Status:** ${isPublished ? `✅ Publicada em <#${categoryData.vitrine_channel_id}>` : '🔴 Não Publicada'}\n**Título:** ${currentTitle}\n**Cor:** ${currentColor}`,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1, // Primary (Blurple)
                            label: 'Alterar Título',
                            emoji: { name: '✏️' },
                            custom_id: `store_cv_set_title_${catId}`
                        },
                        {
                            type: 2,
                            style: 1,
                            label: 'Alterar Descrição',
                            emoji: { name: '📝' },
                            custom_id: `store_cv_set_desc_${catId}`
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Banner (Imagem)',
                            emoji: { name: '🖼️' },
                            custom_id: `store_cv_set_image_${catId}`
                        },
                        {
                            type: 2,
                            style: 1,
                            label: 'Cor da Embed',
                            emoji: { name: '🎨' },
                            custom_id: `store_cv_set_color_${catId}`
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: isPublished ? 3 : 3, // Green
                            label: 'Publicar/Atualizar Vitrine',
                            emoji: { name: '🚀' },
                            custom_id: `store_cv_publish_start_${catId}`
                        },
                        {
                            type: 2,
                            style: 4, // Red (Danger)
                            label: 'Deletar Vitrine',
                            emoji: { name: '🗑️' },
                            custom_id: `store_cv_delete_${catId}`,
                            disabled: !isPublished
                        }
                    ]
                },
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2, // Secondary
                            label: 'Voltar para Categorias',
                            emoji: { name: '⬅️' },
                            custom_id: 'store_manage_categories'
                        }
                    ]
                }
            ]
        }
    };
};