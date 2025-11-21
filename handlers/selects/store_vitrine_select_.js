// Arquivo: handlers/selects/store_vitrine_select_.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const { V2_FLAG, EPHEMERAL_FLAG } = require('../../utils/constants');

module.exports = {
    customId: 'store_vitrine_select_', // Captura store_vitrine_select_CATEGORIAID
    execute: async (interaction) => {
        // O value vem como "prod_123"
        const rawValue = interaction.values[0];
        const productId = rawValue.replace('prod_', '');

        // Busca o produto no DB
        const productResult = await db.query('SELECT * FROM store_products WHERE id = $1', [productId]);
        
        if (productResult.rows.length === 0) {
            return interaction.reply({ 
                content: '❌ Este produto não existe mais ou foi removido.', 
                flags: EPHEMERAL_FLAG 
            });
        }

        const product = productResult.rows[0];

        // Verifica estoque
        if (product.stock !== -1 && product.stock <= 0 && product.stock_type !== 'GHOST') {
            return interaction.reply({
                content: '🚫 **Produto Esgotado!** Infelizmente acabaram as unidades deste item.',
                flags: EPHEMERAL_FLAG
            });
        }

        // Formata preço
        const priceFormatted = parseFloat(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Cria o Embed de "Carrinho Provisório"
        const cartEmbed = {
            type: 'rich',
            title: '🛒 Confirmação de Interesse',
            description: `Você selecionou:\n\n### ${product.name}\n💵 **Preço:** \`${priceFormatted}\`\n📦 **Tipo de Entrega:** \`${product.stock_type}\`\n\nDeseja proceder para o pagamento ou adicionar ao carrinho?`,
            color: 0x5865F2 // Blurple
        };

        // Botão de Confirmar
        const row = {
            type: 1,
            components: [
                {
                    type: 2, 
                    style: 3, // Success (Green)
                    label: "Confirmar Compra",
                    emoji: { name: "✅" },
                    // ID que vai levar para o checkout (Assumindo que store_confirm_purchase já existe)
                    // Enviamos coupon_none como padrão
                    custom_id: `store_confirm_purchase_products_${product.id}_coupon_none` 
                }
            ]
        };

        // Responde APENAS para o usuário (Efêmero)
        await interaction.reply({
            embeds: [cartEmbed],
            components: [row],
            flags: EPHEMERAL_FLAG
        });
    }
};