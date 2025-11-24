// Substitua em: handlers/selects/select_store_edit_product.js
const db = require('../../database.js');
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'select_store_edit_product',
    async execute(interaction) {
        // Importante: Use update() para trocar a interface na mesma mensagem
        // Se o menu demorar, o deferUpdate() segura a onda, mas o ideal é update direto se possível.
        // Aqui usaremos deferUpdate seguido de editReply para garantir o fetch do banco.
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

        const productId = interaction.values[0];

        // Ignora se selecionou o placeholder "vazio"
        if (productId === 'no_result') return;

        try {
            // 1. Buscar dados atualizados do produto
            const product = (await db.query('SELECT * FROM store_products WHERE id = $1', [productId])).rows[0];

            if (!product) {
                return interaction.editReply({ content: '❌ Produto não encontrado ou excluído.', components: [] });
            }

            // 2. Formatar Preço
            let priceFormatted = "R$ 0,00";
            try {
                priceFormatted = parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            } catch (e) { priceFormatted = `R$ ${product.price}`; }

            // 3. Construir a Interface de Edição (Painel) MANUALMENTE AQUI
            const editPanel = [
                {
                    type: 17,
                    components: [
                        { type: 10, content: `> **✏️ Editando:** ${product.name}` },
                        { type: 10, content: `> **ID:** \`${product.id}\`\n> **Preço:** \`${priceFormatted}\`\n> **Estoque:** ${product.stock === -1 ? 'Infinito' : product.stock}` },
                        { type: 14, divider: true, spacing: 2 },
                        {
                            type: 1, 
                            components: [
                                { type: 2, style: 1, label: "Nome", emoji: { name: "📝" }, custom_id: `store_edit_name_${product.id}` },
                                { type: 2, style: 1, label: "Preço", emoji: { name: "💲" }, custom_id: `store_edit_price_${product.id}` },
                                { type: 2, style: 1, label: "Descrição", emoji: { name: "📄" }, custom_id: `store_edit_desc_${product.id}` },
                                { type: 2, style: 1, label: "Estoque", emoji: { name: "📦" }, custom_id: `store_edit_stock_${product.id}` }
                            ]
                        },
                        {
                            type: 1, 
                            components: [
                                { type: 2, style: 1, label: "Imagem", emoji: { name: "🖼️" }, custom_id: `store_edit_img_${product.id}` },
                                { type: 2, style: 1, label: "Cor", emoji: { name: "🎨" }, custom_id: `store_edit_color_${product.id}` },
                                { type: 2, style: 2, label: "Voltar a Lista", emoji: { name: "↩️" }, custom_id: "store_edit_product" } // Volta pro menu paginado
                            ]
                        }
                    ]
                }
            ];

            // 4. Atualizar a mensagem
            await interaction.editReply({
                components: editPanel,
                flags: V2_FLAG | EPHEMERAL_FLAG
            });

        } catch (error) {
            console.error("Erro ao abrir painel de edição:", error);
            await interaction.followUp({ content: '❌ Erro ao carregar painel.', ephemeral: true });
        }
    }
};