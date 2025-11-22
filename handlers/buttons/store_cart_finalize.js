// File: handlers/buttons/store_cart_finalize.js
const db = require('../../database.js');
const generatePaymentMenu = require('../../ui/store/paymentMenu.js');

// Flags V2 (Essenciais)
const V2_FLAG = 1 << 15;
const EPHEMERAL_FLAG = 1 << 6;

module.exports = {
    customId: 'store_cart_finalize',
    async execute(interaction, guildSettings) {
        try {
            // 1. MUDANÇA CRÍTICA: Usamos deferReply para criar uma NOVA mensagem efêmera.
            // Isso permite usar a Interface V2 (PaymentMenu) mesmo vindo de um Embed V1 (Cart).
            await interaction.deferReply({ ephemeral: true });

            // 2. Busca os dados do carrinho
            const cartResult = await db.query("SELECT * FROM store_carts WHERE channel_id = $1", [interaction.channel.id]);
            const cart = cartResult.rows[0];

            if (!cart) {
                return interaction.editReply({ content: '❌ Carrinho não encontrado.' });
            }

            if (!cart.products_json || cart.products_json.length === 0) {
                return interaction.editReply({ content: '⚠️ Seu carrinho está vazio.' });
            }

            // 3. Busca cupom (se houver)
            let coupon = null;
            if (cart.coupon_id) {
                const couponResult = await db.query("SELECT * FROM store_coupons WHERE id = $1", [cart.coupon_id]);
                coupon = couponResult.rows[0];
            }

            // 4. Gera a Interface de Pagamento (V2)
            const menuArray = generatePaymentMenu(cart, guildSettings, coupon, interaction.guild);

            // 5. Prepara o Payload
            // Como estamos usando deferReply, editamos a resposta inicial com a nossa interface V2
            const payload = menuArray[0];
            payload.flags = V2_FLAG | EPHEMERAL_FLAG;

            // 6. Envia o Menu de Pagamento
            await interaction.editReply(payload);

        } catch (error) {
            console.error('[Store Finalize] Erro:', error);
            // Se der erro, tenta avisar (sem as flags V2 para garantir que a mensagem de erro saia)
            if (interaction.deferred) {
                await interaction.editReply({ content: '❌ Ocorreu um erro ao carregar a tela de pagamento.' });
            }
        }
    }
};