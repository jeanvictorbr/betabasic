// File: handlers/buttons/store_cart_finalize.js
const db = require('../../database.js');
const generatePaymentMenu = require('../../ui/store/paymentMenu.js');
const { EPHEMERAL_FLAG } = require('../../utils/constants.js');

module.exports = {
    customId: 'store_cart_finalize',
    async execute(interaction, guildSettings) {
        // Importante: deferUpdate evita que a interação expire enquanto processamos
        await interaction.deferUpdate();

        try {
            const cartResult = await db.query("SELECT * FROM store_carts WHERE channel_id = $1", [interaction.channel.id]);
            const cart = cartResult.rows[0];

            if (!cart) return interaction.followUp({ content: '❌ Carrinho não encontrado.', flags: EPHEMERAL_FLAG });
            if (!cart.products_json || cart.products_json.length === 0) return interaction.followUp({ content: '⚠️ Carrinho vazio.', flags: EPHEMERAL_FLAG });

            let coupon = null;
            if (cart.coupon_id) {
                const couponResult = await db.query("SELECT * FROM store_coupons WHERE id = $1", [cart.coupon_id]);
                coupon = couponResult.rows[0];
            }

            const menu = generatePaymentMenu(cart, guildSettings, coupon, interaction.guild);

            // Atualiza o painel do carrinho para o menu de pagamento
            // Passamos menu[0] pois é um array V2
            await interaction.editReply(menu[0]);

        } catch (error) {
            console.error('[Store Finalize] Erro:', error);
            await interaction.followUp({ content: '❌ Erro ao carregar pagamento.', flags: EPHEMERAL_FLAG });
        }
    }
};