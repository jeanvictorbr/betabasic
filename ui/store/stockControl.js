module.exports = async (product) => {
    return {
        embeds: [{
            title: `📦 Gerenciar: ${product.name}`,
            description: `Utilize os botões abaixo para alterar o estoque deste produto.`,
            color: 0x5865F2, // Blurple
            fields: [
                { name: '🏷️ Preço', value: `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`, inline: true },
                { name: '📊 Estoque Atual', value: `\`${product.stock || 0}\` unidades`, inline: true },
                { name: '📅 Última Atualização', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
            ]
        }],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2, style: 3, label: 'Adicionar (+)', // Green
                        custom_id: `store_add_stock_${product.id}`, // Usa seu handler existente de adicionar? Se não tiver, crie um genérico
                        emoji: { name: '➕' }
                    },
                    {
                        type: 2, style: 4, label: 'Remover (-)', // Red
                        custom_id: `store_remove_stock_${product.id}`, // Adapte para seu handler de remover
                        emoji: { name: '➖' }
                    },
                    {
                        type: 2, style: 1, label: 'Definir Total', // Blurple
                        custom_id: `store_edit_stock_${product.id}`, // Usa o handler existente store_edit_stock_
                        emoji: { name: '✏️' }
                    },
                    {
                        type: 2, style: 2, label: 'Voltar à Lista', // Grey
                        custom_id: 'store_manage_stock', // Volta para o menu principal
                        emoji: { name: '🔙' }
                    }
                ]
            }
        ]
    };
};