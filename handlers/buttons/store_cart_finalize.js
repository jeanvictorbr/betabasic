// File: handlers/buttons/store_cart_finalize.js
const db = require('../../database.js');
const generatePaymentMenu = require('../../ui/store/paymentMenu.js');
const { EPHEMERAL_FLAG } = require('../../utils/constants.js');

module.exports = {
    customId: 'store_cart_finalize',
    async execute(interaction, guildSettings) {
        // 1. Adia a resposta para dar tempo de processar (evita o erro de "interação falhou")
        await interaction.deferUpdate();

        try {
            // 2. Busca os dados do carrinho e configurações
            const cartResult = await db.query("SELECT * FROM store_carts WHERE channel_id = $1", [interaction.channel.id]);
            const cart = cartResult.rows[0];

            if (!cart) {
                return interaction.followUp({ content: '❌ Carrinho não encontrado.', flags: EPHEMERAL_FLAG });
            }

            if (cart.products_json.length === 0) {
                return interaction.followUp({ content: '⚠️ Seu carrinho está vazio.', flags: EPHEMERAL_FLAG });
            }

            // 3. Busca cupom (se houver)
            let coupon = null;
            if (cart.coupon_id) {
                const couponResult = await db.query("SELECT * FROM store_coupons WHERE id = $1", [cart.coupon_id]);
                coupon = couponResult.rows[0];
            }

            // 4. Gera o Menu de Pagamento (Formato V2 - Array)
            const payload = generatePaymentMenu(cart, guildSettings, coupon, interaction.guild);

            // 5. Verifica se o payload é válido antes de enviar
            if (!payload || !Array.isArray(payload)) {
                throw new Error("O menu de pagamento não retornou um formato V2 válido.");
            }

            // 6. Atualiza a mensagem do painel (Troca de Carrinho para Pagamento)
            // OBS: Como é V2, passamos o primeiro objeto do array diretamente
            await interaction.editReply(payload[0]);

        } catch (error) {
            console.error('[Store Finalize] Erro:', error);
            await interaction.followUp({ 
                content: '❌ Ocorreu um erro ao carregar a tela de pagamento. Tente novamente.', 
                flags: EPHEMERAL_FLAG 
            });
        }
    }
};