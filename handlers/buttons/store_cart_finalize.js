// File: handlers/buttons/store_cart_finalize.js
const db = require('../../database.js');
const generatePaymentMenu = require('../../ui/store/paymentMenu.js');

// Definição das Flags (CRUCIAL para interfaces V2 funcionarem)
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_cart_finalize',
    async execute(interaction, guildSettings) {
        // 1. Adia a atualização para não dar erro de "interação falhou"
        await interaction.deferUpdate();

        try {
            // 2. Busca os dados do carrinho
            const cartResult = await db.query("SELECT * FROM store_carts WHERE channel_id = $1", [interaction.channel.id]);
            const cart = cartResult.rows[0];

            if (!cart) {
                return interaction.followUp({ content: '❌ Carrinho não encontrado.', flags: EPHEMERAL_FLAG });
            }

            if (!cart.products_json || cart.products_json.length === 0) {
                return interaction.followUp({ content: '⚠️ Seu carrinho está vazio.', flags: EPHEMERAL_FLAG });
            }

            // 3. Busca cupom (se houver)
            let coupon = null;
            if (cart.coupon_id) {
                const couponResult = await db.query("SELECT * FROM store_coupons WHERE id = $1", [cart.coupon_id]);
                coupon = couponResult.rows[0];
            }

            // 4. Gera a Interface de Pagamento
            const menuArray = generatePaymentMenu(cart, guildSettings, coupon, interaction.guild);

            // 5. Prepara o Payload com as Flags
            // AQUI ESTAVA O ERRO: Precisamos pegar o objeto do array e adicionar as flags
            // para que o Discord aceite componentes de texto (type 10) e divisores (type 14).
            const payload = menuArray[0];
            payload.flags = V2_FLAG | EPHEMERAL_FLAG;

            // 6. Atualiza a mensagem
            await interaction.editReply(payload);

        } catch (error) {
            console.error('[Store Finalize] Erro:', error);
            await interaction.followUp({ 
                content: '❌ Ocorreu um erro ao carregar a tela de pagamento.', 
                flags: EPHEMERAL_FLAG 
            });
        }
    }
};