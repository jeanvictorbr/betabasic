// Crie em: ui/store/categoriesMenu.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = function generateCategoriesMenu(categories) {
    // Monta um texto simples listando as categorias existentes (apenas visual)
    let description = "> **📂 Painel de Categorias**\n> Aqui você gerencia as seções da sua loja.\n\n";
    
    if (categories.length > 0) {
        description += "**Categorias Atuais:**\n";
        // Lista as primeiras 15 para não poluir, o resto fica no menu de edição
        categories.slice(0, 15).forEach(c => {
            description += `> • \`${c.id}\` - **${c.name}**\n`;
        });
        if (categories.length > 15) description += `> *...e mais ${categories.length - 15} categorias.*\n`;
    } else {
        description += "> *Nenhuma categoria criada ainda.*\n";
    }

    description += "\nUse os botões abaixo para gerenciar:";

    return [
        {
            type: 17,
            components: [
                { type: 10, content: description },
                { type: 14, divider: true, spacing: 2 },
                {
                    type: 1,
                    components: [
                        // BOTÃO 1: CRIAR (Já existia)
                        { 
                            type: 2, style: 3, // Success (Verde)
                            label: "Criar Categoria", 
                            emoji: { name: "✨" }, 
                            custom_id: "store_add_category" 
                        },
                        // BOTÃO 2: EDITAR (O que faltava!) -> Chama o menu paginado
                        { 
                            type: 2, style: 1, // Primary (Azul)
                            label: "Editar Categoria", 
                            emoji: { name: "✏️" }, 
                            custom_id: "store_edit_category", // Chama o handler que criamos
                            disabled: categories.length === 0
                        },
                        // BOTÃO 3: REMOVER (O que faltava!) -> Chama o menu paginado
                        { 
                            type: 2, style: 4, // Danger (Vermelho)
                            label: "Remover Categoria", 
                            emoji: { name: "🗑️" }, 
                            custom_id: "store_remove_category", // Chama o handler que criamos
                            disabled: categories.length === 0
                        }
                    ]
                },
                { type: 14, divider: true, spacing: 1 },
                {
                    type: 1,
                    components: [
                        // Botão Voltar ao Menu Principal da Loja
                        { 
                            type: 2, style: 2, 
                            label: "Voltar para Loja", 
                            emoji: { name: "↩️" }, 
                            custom_id: "store_manage_products" 
                        }
                    ]
                }
            ]
        }
    ];
};