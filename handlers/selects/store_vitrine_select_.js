// Arquivo: handlers/selects/store_vitrine_select_.js
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'store_vitrine_select_', // Captura store_vitrine_select_CATEGORIAID
    execute: async (interaction) => {
        const categoryId = interaction.customId.split('_').pop();
        const rawValue = interaction.values[0];
        const productId = rawValue.replace('prod_', '');

        // 1. Busca o produto selecionado para validar e mostrar info
        const productResult = await db.query('SELECT * FROM store_products WHERE id = $1', [productId]);
        
        if (productResult.rows.length === 0) {
            return interaction.reply({ 
                content: '❌ Este produto não existe mais ou foi removido.', 
                flags: EPHEMERAL_FLAG 
            });
        }

        const product = productResult.rows[0];

        // Validação de Estoque
        if (product.stock !== -1 && product.stock <= 0 && product.stock_type !== 'GHOST') {
            return interaction.reply({
                content: '🚫 **Produto Esgotado!** Infelizmente acabaram as unidades deste item.',
                flags: EPHEMERAL_FLAG
            });
        }

        // 2. PREPARAÇÃO PARA O RESET DO MENU (INTERACTION.UPDATE)
        // Precisamos reconstruir o menu da categoria para "limpar" a seleção do usuário na UI
        const productsResult = await db.query(
            'SELECT * FROM store_products WHERE category_id = $1 AND is_enabled = true ORDER BY id ASC',
            [categoryId]
        );
        const catProducts = productsResult.rows;
        
        // Reconstrói o componente SelectMenu (igual ao updateStoreVitrine.js)
        const components = [];
        if (catProducts.length > 0) {
            const select = new StringSelectMenuBuilder()
                .setCustomId(`store_vitrine_select_${categoryId}`)
                .setPlaceholder('🛒 Selecione um produto...');

            const options = catProducts.slice(0, 25).map(p => {
                const price = parseFloat(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                let stockText;
                if (p.stock_type === 'GHOST') {
                        stockText = '📦 Estoque: Ilimitado (Ghost)';
                } else if (p.stock === -1) {
                        stockText = '📦 Estoque: Ilimitado';
                } else {
                        stockText = `📦 Restam: ${p.stock} unidades`;
                }

                return {
                    label: `${p.name} [${price}]`,
                    description: stockText,
                    value: `prod_${p.id}`,
                    emoji: p.emoji || '🏷️'
                };
            });

            select.addOptions(options);
            components.push(new ActionRowBuilder().addComponents(select));
        }

        // 3. EXECUTA O UPDATE (Reseta o menu na mensagem original)
        // Nota: Mantemos os embeds originais da mensagem (interaction.message.embeds)
        await interaction.update({
            embeds: interaction.message.embeds,
            components: components
        });

        // 4. ENVIA O CARRINHO PROVISÓRIO (FollowUp Efêmero)
        const priceFormatted = parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const cartEmbed = {
            type: 'rich',
            title: '🛒 Confirmação de Interesse',
            description: `Você selecionou:\n\n### ${product.name}\n💵 **Preço:** \`${priceFormatted}\`\n📦 **Tipo de Entrega:** \`${product.stock_type}\`\n\nDeseja proceder para o pagamento ou adicionar ao carrinho?`,
            color: 0x5865F2
        };

        const row = {
            type: 1,
            components: [
                {
                    type: 2, 
                    style: 3, // Success
                    label: "Confirmar Compra",
                    emoji: { name: "✅" },
                    custom_id: `store_confirm_purchase_products_${product.id}_coupon_none` 
                }
            ]
        };

        await interaction.followUp({
            embeds: [cartEmbed],
            components: [row],
            flags: EPHEMERAL_FLAG
        });
    }
};